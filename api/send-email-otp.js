import { createClient } from '@supabase/supabase-js';

global.memoryOtps = global.memoryOtps || new Map();

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (url && key) {
    try {
      return createClient(url, key);
    } catch (e) {
      console.error('Supabase init error in send-email-otp:', e);
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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email } = req.body || {};
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    // 1. Store in Memory fallback for immediate local testing
    global.memoryOtps.set(cleanEmail, { code, expiresAt: expiresAtMs, attempts: 0 });

    // 2. Store in Supabase email_otps table
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error: supaErr } = await supabase
          .from('email_otps')
          .upsert({
            email: cleanEmail,
            code,
            expires_at: expiresAtIso,
            attempts: 0,
            created_at: new Date().toISOString()
          }, { onConflict: 'email' });

        if (supaErr) {
          console.error('Supabase OTP write error:', supaErr);
        } else {
          console.log(`[Supabase OTP] Stored code for ${cleanEmail} in email_otps table.`);
        }
      } catch (err) {
        console.error('Supabase connection error:', err);
      }
    } else {
      console.warn('Supabase URL/Key missing in process.env. Stored in memory fallback.');
    }

    // 3. Dispatch via Resend API
    const resendApiKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY || '';

    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'IkoroduSquare <noreply@ikorodusquare.com.ng>',
          to: [cleanEmail],
          subject: 'Your IkoroduSquare verification code',
          html: `<div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #059669; margin-top: 0;">IkoroduSquare Vendor Verification</h2>
            <p style="color: #334155; font-size: 15px;">Your 6-digit verification code is:</p>
            <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px solid #10b981; border-radius: 8px; display: inline-block; margin: 12px 0;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 13px; margin-top: 16px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
          </div>`
        })
      });

      const resData = await emailResponse.json();
      console.log('Resend API response:', resData);

      if (!emailResponse.ok) {
        return res.status(500).json({
          success: false,
          error: resData.message || 'Failed to dispatch email via Resend API.'
        });
      }
    } else {
      console.warn('RESEND_API_KEY environment variable is missing.');
    }

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your email inbox.`
    });
  } catch (error) {
    console.error('send-email-otp error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
}
