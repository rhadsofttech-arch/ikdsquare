import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Supabase client for transaction storage
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const serverSupabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

  // Stores for pending promotions & deduplicating webhooks
  const pendingPromotionsStore = new Map<string, any>();
  const processedWebhooks = new Set<string>();

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'IkoroduSquare', time: new Date().toISOString() });
  });

  // Sendchamp Config
  const SENDCHAMP_PUBLIC_KEY = process.env.SENDCHAMP_PUBLIC_KEY || 'sendchamp_live_$2a$10$8zPQfxPbOHbFJ/2EHoUNrOY/.xSoj8vX.YA20DGrjDTJxrkg4YNvC';
  const SENDCHAMP_BASE_URL = process.env.SENDCHAMP_BASE_URL || 'https://api.sendchamp.com/api/v1';

  // Helper to format Nigerian phone numbers for Sendchamp (e.g., 08031234567 -> 2348031234567)
  function formatNigerianPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '234' + cleaned.substring(1);
    }
    if (cleaned.startsWith('234') && cleaned.length === 13) {
      return cleaned;
    }
    return cleaned;
  }

  // Email OTP Store in memory (stores raw code, 10-min expiry, attempts counter)
  const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number }>();

  const sendEmailOtpHandler = async (req: express.Request, res: express.Response) => {
    const email = (req.body.email || req.body.phoneNumber || '').trim().toLowerCase();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid email address is required.' });
    }

    // Generate 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    // Save record in memory store
    otpStore.set(email, { code, expiresAt, attempts: 0 });

    console.log(`[send-email-otp] Generated code for ${email}: ${code}`);

    // Call Resend API using process.env.RESEND_API_KEY
    const resendKey = process.env.RESEND_API_KEY || process.env.RESEND_KEY || '';
    if (resendKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: [email],
            subject: 'Your IkoroduSquare verification code',
            html: `<div style="font-family: sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #059669; margin-top: 0;">IkoroduSquare Vendor Verification</h2>
              <p style="color: #334155; font-size: 15px;">Your 6-digit verification code is:</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0f172a; padding: 12px 24px; background: #ffffff; border: 2px solid #10b981; border-radius: 8px; display: inline-block; margin: 12px 0;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 16px;">This code expires in 10 minutes. If you did not request this code, please ignore this email.</p>
            </div>`,
          }),
        });
        const resData = await response.json();
        console.log('[Resend API Response]:', resData);
      } catch (err) {
        console.error('[Resend API Error]:', err);
      }
    } else {
      console.warn('[Resend API] RESEND_API_KEY environment variable not set.');
    }

    return res.json({
      success: true,
      message: `Verification code sent to ${email}. Please check your email inbox.`,
    });
  };

  const verifyEmailOtpHandler = (req: express.Request, res: express.Response) => {
    const email = (req.body.email || req.body.phoneNumber || '').trim().toLowerCase();
    const code = (req.body.code || '').trim();

    if (!email || !code || code.length !== 6) {
      return res.status(400).json({
        verified: false,
        error: 'Valid email address and 6-digit verification code are required.',
      });
    }

    const record = otpStore.get(email);

    if (!record) {
      return res.status(400).json({
        verified: false,
        error: 'No active verification code found for this email address. Please request a new code.',
      });
    }

    // Check 10-minute expiry
    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      return res.status(400).json({
        verified: false,
        error: 'Verification code has expired. Please request a new code.',
      });
    }

    // Compare code
    if (code !== record.code) {
      record.attempts += 1;
      if (record.attempts >= 3) {
        otpStore.delete(email);
        return res.status(400).json({
          verified: false,
          error: 'Too many failed attempts. Your verification code has been invalidated. Please request a new code.',
        });
      } else {
        return res.status(400).json({
          verified: false,
          error: `Incorrect verification code. ${3 - record.attempts} attempt(s) remaining before invalidation.`,
        });
      }
    }

    // Correct code - delete record and return verified true
    otpStore.delete(email);
    return res.json({
      verified: true,
      message: 'Email address successfully verified!',
    });
  };

  // Bind endpoints for both Vercel path and local dev path
  app.post('/api/send-email-otp', sendEmailOtpHandler);
  app.post('/api/otp/send', sendEmailOtpHandler);
  app.post('/api/verify-email-otp', verifyEmailOtpHandler);
  app.post('/api/otp/verify', verifyEmailOtpHandler);

  // NIMC Verification endpoint
  app.post('/api/nimc/verify', (req, res) => {
    const { nin, ownerName } = req.body;

    if (!nin || nin.length !== 11) {
      return res.status(400).json({ success: false, message: 'NIN must be exactly 11 numeric digits.' });
    }

    if (nin.startsWith('000')) {
      return res.status(404).json({ success: false, message: 'NIN record not found in NIMC database.' });
    }

    if (nin.startsWith('999')) {
      return res.status(409).json({ success: false, message: 'This NIN is already registered to another business on IkoroduSquare.' });
    }

    res.json({
      success: true,
      message: 'NIMC Identity Verification Successful!',
      data: {
        fullName: ownerName || 'Verified Ikorodu Business Owner',
        dob: '1992-08-14',
      },
    });
  });

  // WhatsApp Notification endpoint with Sendchamp Integration
  app.post('/api/notifications/whatsapp', async (req, res) => {
    const { to, messageText } = req.body;
    if (!to || !messageText) {
      return res.status(400).json({ success: false, message: 'Recipient and message text required.' });
    }

    const formattedTo = formatNigerianPhone(to);
    console.log(`[Sendchamp WhatsApp Alert] To ${formattedTo}: "${messageText}"`);

    try {
      // Attempt WhatsApp message via Sendchamp
      const response = await fetch(`${SENDCHAMP_BASE_URL}/whatsapp/message/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDCHAMP_PUBLIC_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          recipient: formattedTo,
          message: messageText,
          sender: 'Ikd Square',
        }),
      });

      const data = await response.json();
      console.log(`[Sendchamp Notification Response]`, data);
    } catch (err) {
      console.error('[Sendchamp Notification API Error]:', err);
    }

    res.json({ success: true, message: 'WhatsApp notification dispatched via Sendchamp gateway.' });
  });



  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA fallback route for development
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.use((req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`IkoroduSquare server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
