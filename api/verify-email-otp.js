import { createClient } from '@supabase/supabase-js';

global.memoryOtps = global.memoryOtps || new Map();

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Supabase init error in verify-email-otp:', e);
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, error: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanCode = (code || '').trim();

    if (!cleanEmail || !cleanCode || cleanCode.length !== 6) {
      return res.status(400).json({
        verified: false,
        error: 'Valid email address and 6-digit code are required.'
      });
    }

    let record = null;
    let source = null;
    const supabase = getSupabaseClient();

    // 1. Fetch from Supabase email_otps
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('email_otps')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (data && !error) {
          record = {
            code: data.code,
            expiresAt: new Date(data.expires_at).getTime(),
            attempts: data.attempts || 0
          };
          source = 'supabase';
        }
      } catch (err) {
        console.error('Supabase fetch error:', err);
      }
    }

    // 2. Fallback to Memory store if not found in Supabase
    if (!record && global.memoryOtps.has(cleanEmail)) {
      record = global.memoryOtps.get(cleanEmail);
      source = 'memory';
    }

    if (!record) {
      return res.status(400).json({
        verified: false,
        error: 'No active verification code found for this email address. Please request a new code.'
      });
    }

    // Check expiration
    if (Date.now() > record.expiresAt) {
      await deleteRecord(cleanEmail, source, supabase);
      return res.status(400).json({
        verified: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Check code match
    if (cleanCode !== record.code) {
      const attempts = (record.attempts || 0) + 1;
      if (attempts >= 3) {
        await deleteRecord(cleanEmail, source, supabase);
        return res.status(400).json({
          verified: false,
          error: 'Too many failed attempts. Your verification code has been invalidated. Please request a new code.'
        });
      } else {
        await updateAttempts(cleanEmail, attempts, source, supabase);
        return res.status(400).json({
          verified: false,
          error: `Incorrect verification code. ${3 - attempts} attempt(s) remaining before invalidation.`
        });
      }
    }

    // Correct code: invalidate OTP and return success
    await deleteRecord(cleanEmail, source, supabase);

    return res.status(200).json({
      verified: true,
      message: 'Email address successfully verified!'
    });
  } catch (error) {
    console.error('verify-email-otp error:', error);
    return res.status(500).json({ verified: false, error: error.message || 'Internal server error' });
  }
}

async function deleteRecord(email, source, supabase) {
  global.memoryOtps.delete(email);
  if (supabase) {
    try {
      await supabase.from('email_otps').delete().eq('email', email);
    } catch (e) {
      console.error('Supabase OTP delete error:', e);
    }
  }
}

async function updateAttempts(email, attempts, source, supabase) {
  if (global.memoryOtps.has(email)) {
    const item = global.memoryOtps.get(email);
    item.attempts = attempts;
  }
  if (supabase) {
    try {
      await supabase.from('email_otps').update({ attempts }).eq('email', email);
    } catch (e) {
      console.error('Supabase OTP update error:', e);
    }
  }
}
