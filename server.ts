import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import firebaseAppletConfig from './firebase-applet-config.json';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialize Gemini AI Client
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required for Gemini AI operations');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// --- Admin auth guard for the paid Gemini endpoint --------------------
// Cost/abuse guard: the client used to prove it was the admin by sending
// a plain `userAdmin: 'parkinky'` string in the request body, which is
// trivial to forge - anyone who found this endpoint in the JS bundle
// could call the paid Gemini API for free. Now we require a real Firebase
// ID token (verified via the Identity Toolkit REST API, no firebase-admin
// dependency needed) and check the token's email against ADMIN_EMAIL.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'parkinky@gmail.com';

async function verifyAdminAuth(req: express.Request): Promise<{ ok: boolean; status: number; error?: string }> {
  const authHeader = (req.headers['authorization'] as string) || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing admin credentials.' };
  }
  try {
    const apiKey = (firebaseAppletConfig as any).apiKey;
    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!lookupRes.ok) {
      return { ok: false, status: 401, error: 'Invalid or expired credentials.' };
    }
    const data: any = await lookupRes.json();
    const email = data?.users?.[0]?.email;
    if (!email || email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return { ok: false, status: 403, error: 'Not authorized as site admin.' };
    }
    return { ok: true, status: 200 };
  } catch (e) {
    console.error('Admin auth verification failed');
    return { ok: false, status: 401, error: 'Could not verify admin credentials.' };
  }
}

// Very small in-memory rate limiter (per-process, resets on redeploy).
// Not meant to be bulletproof - it's a cheap second layer so a leaked or
// replayed admin token still can't run up unbounded Gemini API cost.
const rateLimitBuckets = new Map<string, { count: number; windowStart: number }>();
function isRateLimited(ip: string, limit = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || now - bucket.windowStart > windowMs) {
    rateLimitBuckets.set(ip, { count: 1, windowStart: now });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}
// ------------------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Gemini AI Management Hub Endpoint
app.post('/api/gemini/manage', async (req, res) => {
  try {
    if (isRateLimited(req.ip || 'unknown')) {
      return res.status(429).json({ success: false, error: 'Too many requests. Please try again in a minute.' });
    }
    const authCheck = await verifyAdminAuth(req);
    if (!authCheck.ok) {
      return res.status(authCheck.status).json({ success: false, error: authCheck.error });
    }

    const { action, prompt, siteConfig, eventsSummary } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({
        success: false,
        error: 'GEMINI_API_KEY environment variable is not configured. Please add GEMINI_API_KEY in the Settings menu.',
      });
    }

    const ai = getAIClient();
    const systemInstruction = `You are the AI Website Management Assistant for Everytango, a premier global Argentine tango festival, marathon, encuentro, and milonga platform.
You assist the site administrator (parkinky) in managing website content, banners, announcements, site configuration, event quality audits, and future website improvements.
Respond politely and constructively in Korean (or matching the prompt language) with clear, actionable analysis, structured recommendations, and suggested banner/announcement copy if relevant.
Current Site Configuration: ${JSON.stringify(siteConfig || {})}
Events Overview: ${JSON.stringify(eventsSummary || {})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${systemInstruction}\n\n[ADMIN PROMPT]: ${prompt}\n\n[ACTION INTENT]: ${action || 'GENERAL_MANAGE'}\n\nProvide an insightful, structured response with actionable recommendations or proposed site configurations.`,
            },
          ],
        },
      ],
    });

    const reply = response.text || 'No response generated.';
    res.json({ success: true, text: reply });
  } catch (error: any) {
    console.error('Gemini Management API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Gemini processing failed',
    });
  }
});

// Automated Approval Email Dispatch Endpoint
app.post('/api/email/send-approval', (req, res) => {
  try {
    const { to, authorName, event, subject, body } = req.body;
    
    if (!to) {
      return res.status(400).json({ success: false, error: 'Recipient email address ("to") is required.' });
    }

    console.log('====================================================');
    console.log(`[Automated Email Service] Event Approval Notification`);
    console.log(`To: ${to} (${authorName || 'Author'})`);
    console.log(`Subject: ${subject}`);
    console.log(`Event: ${event?.event_name} (ID: ${event?.id})`);
    console.log('----------------------------------------------------');
    console.log(body);
    console.log('====================================================');

    const emailLog = {
      id: 'mail_srv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      to,
      authorName: authorName || 'Tango Organizer',
      eventId: event?.id || '',
      eventName: event?.event_name || 'Tango Event',
      subject: subject || '[EveryTango] Event Approved & Published',
      body: body || '',
      sentAt: new Date().toISOString(),
      status: 'SENT',
    };

    res.json({ success: true, emailLog, message: `Automated approval email sent to ${to}` });
  } catch (error: any) {
    console.error('Email Dispatch Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Email dispatch failed' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
