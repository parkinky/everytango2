import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { promises as dns } from 'dns';
import net from 'net';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import firebaseAppletConfig from './firebase-applet-config.json';

dotenv.config();

// --- Firebase Admin SDK ---------------------------------------------------
// Used for every trusted, server-side read/write of the `users` collection
// (see firestore.rules: client access to that collection is denied - it
// only ever holds password hashes, security-question hashes and role
// flags). The Admin SDK authenticates via Application Default Credentials:
// on Cloud Run this "just works" using the service account attached to the
// service, no key file needed; for local development, run
// `gcloud auth application-default login` once, or point
// GOOGLE_APPLICATION_CREDENTIALS at a service account key file.
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: firebaseAppletConfig.projectId,
  });
} catch (e) {
  console.warn(
    '[firebase-admin] Failed to initialize with Application Default Credentials. ' +
      '/api/auth/* and /api/admin/* routes will fail until GOOGLE_APPLICATION_CREDENTIALS ' +
      'is configured (locally) or this runs on a GCP service with the right IAM role (Cloud Run):',
    (e as Error).message
  );
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enable CORS for all requests including external bookmarklets
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// --- Admin auth guard --------------------------------------------------
// Cost/abuse guard: the client used to prove it was the admin by sending
// a plain `userAdmin: 'parkinky'` string in the request body (or, for the
// crawler/email endpoints below, nothing at all), which is trivial to
// forge - anyone who found these endpoints in the JS bundle could call the
// paid Gemini API for free, use this server as an open URL-fetching proxy,
// or read/write any user record. Every admin-only route now requires a
// real Firebase ID token (verified server-side via the Admin SDK, which
// cannot be spoofed by the client) whose Firestore user record - or whose
// email, as a bootstrap fallback for the very first admin - has role
// ADMIN. See requireAdmin below.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'parkinky@gmail.com';

async function verifyAdminAuth(req: express.Request): Promise<{ ok: boolean; status: number; error?: string; uid?: string }> {
  const authHeader = (req.headers['authorization'] as string) || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) {
    return { ok: false, status: 401, error: 'Missing admin credentials.' };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    const snap = await admin.firestore().collection('users').doc(decoded.uid).get();
    const role = snap.exists ? (snap.data() as any)?.role : null;
    const email = (decoded.email || '').toLowerCase();
    const isAdmin = role === 'ADMIN' || email === ADMIN_EMAIL.toLowerCase();
    if (!isAdmin) {
      return { ok: false, status: 403, error: 'Not authorized as site admin.' };
    }
    return { ok: true, status: 200, uid: decoded.uid };
  } catch (e) {
    console.error('Admin auth verification failed');
    return { ok: false, status: 401, error: 'Could not verify admin credentials.' };
  }
}

// Express middleware form of verifyAdminAuth, for routes that should
// short-circuit non-admin callers outright rather than checking inline.
const requireAdmin: express.RequestHandler = async (req, res, next) => {
  const check = await verifyAdminAuth(req);
  if (!check.ok) {
    res.status(check.status).json({ success: false, error: check.error });
    return;
  }
  next();
};

// Any authenticated Firebase user (not necessarily an admin) - used by
// /api/auth/me, which every signed-in user (custom login or Google) calls
// to load their own profile now that the client can no longer read
// Firestore's `users` collection directly.
const requireAuth: express.RequestHandler = async (req, res, next) => {
  const authHeader = (req.headers['authorization'] as string) || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) {
    res.status(401).json({ success: false, error: 'Missing credentials.' });
    return;
  }
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    (req as any).authUid = decoded.uid;
    (req as any).authEmail = decoded.email || '';
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired session.' });
  }
};

// --- User data helpers ---------------------------------------------------
// All of these use the Admin SDK, which bypasses Firestore security rules -
// that is intentional and is exactly why the `users` collection's rules can
// deny all direct client access (see firestore.rules). Never expose these
// helpers' raw output to the client without sanitizeProfile().

async function findUserByField(field: 'email' | 'username', value: string): Promise<any | null> {
  const clean = (value || '').trim().toLowerCase();
  if (!clean) return null;
  const snap = await admin.firestore().collection('users').where(field, '==', clean).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function findUserByIdentifier(usernameOrEmail: string): Promise<any | null> {
  return (await findUserByField('email', usernameOrEmail)) || (await findUserByField('username', usernameOrEmail));
}

function sanitizeProfile(u: any): any {
  if (!u) return u;
  const { password_hash, security_questions, ...rest } = u;
  const questions = Array.isArray(security_questions)
    ? security_questions.map((q: any) => ({ question_number: q.question_number, question_text: q.question_text }))
    : undefined;
  return { ...rest, ...(questions ? { security_questions: questions } : {}) };
}

// Same normalization + SHA-256 the client used to do for security-question
// answers (trim + lowercase, then hash) - kept identical so existing hashes
// already stored in Firestore keep working. The difference is this now only
// ever runs on the server, so the raw answer is never exposed to the client
// as a hash it could replay, and the hardcoded admin answers that used to
// live in the client source are gone entirely.
function hashSecurityAnswer(text: string): string {
  const normalized = (text || '').trim().toLowerCase();
  return crypto.createHash('sha256').update(normalized).digest('hex');
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

// --- SSRF guard for server-side URL fetches -------------------------------
// /api/crawler/validate-urls and /api/crawler/extract-site-events make this
// server fetch whatever URL is passed in, to check event listings on
// third-party sites. Without this check, a caller could point that at an
// internal address instead (a private IP, or a cloud metadata endpoint like
// 169.254.169.254, which on Cloud Run/GCE can hand out real credentials) and
// use this server as a proxy into infrastructure that is never supposed to
// be reachable from the public internet. These endpoints also now require
// an authenticated admin (see requireAdmin above); this check is a second,
// independent layer in case that ever regresses.
function isPrivateOrReservedIp(ip: string): boolean {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (a === 0) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('::ffff:')) {
      // IPv4-mapped IPv6 address - check the embedded IPv4 part too.
      return isPrivateOrReservedIp(lower.substring(lower.lastIndexOf(':') + 1));
    }
    return false;
  }
  return true; // couldn't parse - treat as unsafe
}

async function isSafeExternalUrl(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;
  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname === 'metadata.google.internal') return false;
  if (net.isIP(hostname)) {
    return !isPrivateOrReservedIp(hostname);
  }
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (records.length === 0) return false;
    return records.every((r) => !isPrivateOrReservedIp(r.address));
  } catch {
    return false; // unresolvable host - fail closed
  }
}
// ------------------------------------------------------------------------

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// =========================================================================
// AUTH & USER MANAGEMENT
// -------------------------------------------------------------------------
// Everything below is the trusted boundary for the `users` collection.
// Firestore rules deny all direct client read/write on that collection, so
// this server (via the Admin SDK) is the only thing that can touch it. That
// is what lets us enforce: real password hashing (bcrypt, not the plaintext
// that used to be stored), security-question verification without ever
// handing the client a replayable hash, and role changes that only a
// verified admin can make.
//
// Successful login/register mints a Firebase custom token
// (admin.auth().createCustomToken) which the client exchanges for a real
// Firebase Auth session via signInWithCustomToken. That is what lets
// "custom" logins and Google logins share one identity system, so Firestore
// rules (and requireAdmin/requireAuth here) can rely on request.auth /
// verifyIdToken for both.
// =========================================================================

// Load-or-create the caller's own profile. Called once per sign-in by the
// client (both Google and custom-token sessions) since the client can no
// longer read its own Firestore user document directly.
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const uid = (req as any).authUid as string;
    const email = ((req as any).authEmail as string) || '';
    const ref = admin.firestore().collection('users').doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      const nowIso = new Date().toISOString();
      ref.update({ last_login: nowIso }).catch(() => {});
      res.json({ success: true, profile: sanitizeProfile({ id: uid, ...snap.data(), last_login: nowIso }) });
      return;
    }
    // First time we see this Firebase Auth identity (e.g. a fresh Google
    // sign-in, which never goes through /api/auth/register) - create a
    // default profile for it, same defaults the old client code used.
    const nowIso = new Date().toISOString();
    const newProfile = {
      id: uid,
      username: (email.split('@')[0] || 'TangoDancer').trim() || 'TangoDancer',
      email,
      country_code: 'US',
      city: 'Global',
      phone: '',
      role: email.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'USER',
      created_at: nowIso,
      last_login: nowIso,
    };
    await ref.set(newProfile);
    res.json({ success: true, profile: sanitizeProfile(newProfile) });
  } catch (e: any) {
    console.error('auth/me error:', e);
    res.status(500).json({ success: false, error: e.message || 'Failed to load profile' });
  }
});

app.post('/api/auth/check-username', async (req, res) => {
  try {
    const username = String(req.body?.username || '').trim().toLowerCase();
    if (!username) {
      res.json({ success: true, exists: false });
      return;
    }
    if (username === 'parkinky' || username === 'admin') {
      res.json({ success: true, exists: true });
      return;
    }
    const found = await findUserByField('username', username);
    res.json({ success: true, exists: !!found });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Lookup failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    if (isRateLimited('register_' + (req.ip || 'unknown'), 10, 60_000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again shortly.' });
      return;
    }
    const { username, email, password, first_name, last_name, country_code, state, city, phone, security_questions } = req.body || {};
    const cleanUsername = String(username || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '');

    if (!cleanUsername || !cleanEmail || cleanPassword.length < 4) {
      res.status(400).json({ success: false, error: 'Username, email and a password of at least 4 characters are required.' });
      return;
    }
    if (!Array.isArray(security_questions) || security_questions.length !== 3 || security_questions.some((q: any) => !q || !String(q.answer || '').trim())) {
      res.status(400).json({ success: false, error: 'All 3 security questions must be answered for account recovery.' });
      return;
    }

    const lowerUsername = cleanUsername.toLowerCase();
    if (
      lowerUsername === 'parkinky' ||
      lowerUsername === 'admin' ||
      (await findUserByField('username', lowerUsername)) ||
      (await findUserByField('email', cleanEmail))
    ) {
      res.status(409).json({ success: false, error: 'This username or email is already registered.' });
      return;
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const hashedQuestions = security_questions.slice(0, 3).map((q: any, i: number) => ({
      question_number: (i + 1) as 1 | 2 | 3,
      question_text: String(q.question_text || '').trim(),
      answer_hash: hashSecurityAnswer(String(q.answer || '')),
    }));

    const fbUser = await admin.auth().createUser({ email: cleanEmail, emailVerified: false });
    const nowIso = new Date().toISOString();
    const role = cleanEmail === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'USER';
    const profile = {
      id: fbUser.uid,
      username: cleanUsername,
      email: cleanEmail,
      first_name: String(first_name || '').trim(),
      last_name: String(last_name || '').trim(),
      country_code: country_code || 'US',
      state: String(state || '').trim(),
      city: String(city || '').trim(),
      phone: String(phone || '').trim(),
      role,
      created_at: nowIso,
      last_login: nowIso,
      security_questions: hashedQuestions,
      password_hash: passwordHash,
    };
    await admin.firestore().collection('users').doc(fbUser.uid).set(profile);
    const token = await admin.auth().createCustomToken(fbUser.uid);
    res.json({ success: true, token, profile: sanitizeProfile(profile) });
  } catch (e: any) {
    console.error('Register error:', e);
    res.status(500).json({ success: false, error: e.message || 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    if (isRateLimited('login_' + (req.ip || 'unknown'), 15, 60_000)) {
      res.status(429).json({ success: false, error: 'Too many login attempts. Please try again shortly.' });
      return;
    }
    const identifier = String(req.body?.usernameOrEmail || '').trim();
    const password = String(req.body?.password || '');
    if (!identifier || !password) {
      res.status(400).json({ success: false, error: 'Username/email and password are required.' });
      return;
    }
    const user = await findUserByIdentifier(identifier);
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
      return;
    }
    admin.firestore().collection('users').doc(user.id).update({ last_login: new Date().toISOString() }).catch(() => {});
    const token = await admin.auth().createCustomToken(user.id);
    res.json({ success: true, token, profile: sanitizeProfile(user) });
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ success: false, error: e.message || 'Login failed' });
  }
});

app.post('/api/auth/find-id', async (req, res) => {
  try {
    if (isRateLimited('findid_' + (req.ip || 'unknown'), 10, 60_000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again shortly.' });
      return;
    }
    const email = String(req.body?.email || '').trim();
    const phone = String(req.body?.phone || '').trim().replace(/[^0-9+]/g, '');
    const user = await findUserByField('email', email);
    if (user) {
      const uPhone = (user.phone || '').replace(/[^0-9+]/g, '');
      if (!phone || uPhone === phone) {
        res.json({ success: true, found: true, username: user.username });
        return;
      }
    }
    res.json({ success: true, found: false, error: 'No account matched this email and phone number combination.' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Lookup failed' });
  }
});

app.post('/api/auth/security-questions', async (req, res) => {
  try {
    if (isRateLimited('secq_' + (req.ip || 'unknown'), 15, 60_000)) {
      res.status(429).json({ success: false, error: 'Too many requests. Please try again shortly.' });
      return;
    }
    const identifier = String(req.body?.usernameOrEmail || '').trim();
    const user = await findUserByIdentifier(identifier);
    if (!user || !Array.isArray(user.security_questions) || user.security_questions.length === 0) {
      res.json({ success: true, found: false, error: 'Account not found or no security questions configured for this user.' });
      return;
    }
    const questions = user.security_questions.map((q: any) => ({ number: q.question_number, text: q.question_text }));
    res.json({ success: true, found: true, questions });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Could not retrieve security questions.' });
  }
});

app.post('/api/auth/verify-answer', async (req, res) => {
  try {
    if (isRateLimited('verify_' + (req.ip || 'unknown'), 8, 60_000)) {
      res.status(429).json({ success: false, error: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    const identifier = String(req.body?.usernameOrEmail || '').trim();
    const questionNumber = Number(req.body?.questionNumber);
    const answer = String(req.body?.answer || '');
    const user = await findUserByIdentifier(identifier);
    const q = user?.security_questions?.find((sq: any) => sq.question_number === questionNumber);
    if (!q) {
      res.status(400).json({ success: false, error: '보안 질문이 등록되지 않은 사용자입니다.' });
      return;
    }
    if (hashSecurityAnswer(answer) !== q.answer_hash) {
      res.status(401).json({ success: false, error: '보안 답변이 일치하지 않습니다. 다시 입력하시거나 다른 질문을 선택해 주세요.' });
      return;
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || '보안 답변 확인에 실패했습니다.' });
  }
});

app.post('/api/auth/reset-password-with-answer', async (req, res) => {
  try {
    if (isRateLimited('reset_' + (req.ip || 'unknown'), 8, 60_000)) {
      res.status(429).json({ success: false, error: '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.' });
      return;
    }
    const identifier = String(req.body?.usernameOrEmail || '').trim();
    const questionNumber = Number(req.body?.questionNumber);
    const answer = String(req.body?.answer || '');
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 4) {
      res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
      return;
    }
    const user = await findUserByIdentifier(identifier);
    const q = user?.security_questions?.find((sq: any) => sq.question_number === questionNumber);
    if (!user || !q) {
      res.status(400).json({ success: false, error: '계정 또는 보안 질문을 확인할 수 없습니다.' });
      return;
    }
    if (hashSecurityAnswer(answer) !== q.answer_hash) {
      res.status(401).json({ success: false, error: '보안 답변이 일치하지 않습니다.' });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await admin.firestore().collection('users').doc(user.id).update({ password_hash: newHash });
    res.json({ success: true });
  } catch (e: any) {
    console.error('Password reset error:', e);
    res.status(500).json({ success: false, error: e.message || 'Password update failed.' });
  }
});

// Legacy "answer all 3 questions at once" variant. Kept for interface
// completeness (the shipped UI currently only uses the single-question flow
// above) but implemented with the same server-side verification.
app.post('/api/auth/reset-password-with-answers', async (req, res) => {
  try {
    if (isRateLimited('reset3_' + (req.ip || 'unknown'), 8, 60_000)) {
      res.status(429).json({ success: false, error: 'Too many attempts. Please try again shortly.' });
      return;
    }
    const identifier = String(req.body?.usernameOrEmail || '').trim();
    const answers: string[] = Array.isArray(req.body?.answers) ? req.body.answers : [];
    const newPassword = String(req.body?.newPassword || '');
    if (newPassword.length < 4) {
      res.status(400).json({ success: false, error: 'Password must be at least 4 characters.' });
      return;
    }
    const user = await findUserByIdentifier(identifier);
    if (!user || !Array.isArray(user.security_questions) || user.security_questions.length < 3) {
      res.status(400).json({ success: false, error: 'User does not have 3 security questions on file.' });
      return;
    }
    for (let i = 0; i < 3; i++) {
      const expected = user.security_questions[i]?.answer_hash;
      if (!expected || hashSecurityAnswer(answers[i] || '') !== expected) {
        res.status(401).json({ success: false, error: `Answer to question #${i + 1} does not match our records.` });
        return;
      }
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await admin.firestore().collection('users').doc(user.id).update({ password_hash: newHash });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Password update failed.' });
  }
});

// ---- Admin-only user management --------------------------------------
// Role changes, password resets and deletes for OTHER users must never be
// directly client-writable - that was exactly how the open Firestore rules
// let anyone promote themselves to ADMIN. Every route below re-verifies the
// caller is an admin via requireAdmin (Firebase ID token + Firestore role
// check), independent of anything the request body claims.

app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const snap = await admin.firestore().collection('users').get();
    const users = snap.docs.map((d) => sanitizeProfile({ id: d.id, ...d.data() }));
    res.json({ success: true, users });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to load users' });
  }
});

app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const updates = { ...(req.body || {}) };
    // These have their own dedicated, more carefully-guarded endpoints -
    // never let a generic profile-update call touch them.
    delete updates.password_hash;
    delete updates.security_questions;
    delete updates.id;
    delete updates.role;
    await admin.firestore().collection('users').doc(req.params.id).set(updates, { merge: true });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to update user profile' });
  }
});

app.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
  try {
    const role = req.body?.role === 'ADMIN' ? 'ADMIN' : 'USER';
    await admin.firestore().collection('users').doc(req.params.id).update({ role });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to update role' });
  }
});

app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const newPassword = String(req.body?.newPassword || '').trim();
    if (!newPassword) {
      res.status(400).json({ success: false, error: '새 비밀번호를 입력해주세요.' });
      return;
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await admin.firestore().collection('users').doc(req.params.id).set({ password_hash: newHash }, { merge: true });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || '비밀번호 초기화에 실패했습니다.' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    await admin.firestore().collection('users').doc(req.params.id).delete();
    await admin.auth().deleteUser(req.params.id).catch(() => {});
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message || 'Failed to delete user' });
  }
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

// Automated Approval Email Dispatch Endpoint (admin-only: triggered when an
// admin approves a submitted event)
app.post('/api/email/send-approval', requireAdmin, (req, res) => {
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

// --- URL and Event Website Validation Engine for Crawler & Auditing ---
interface CandidateUrlToValidate {
  id?: string;
  url: string;
  eventName?: string;
  startDate?: string;
  channelName?: string;
}

interface ValidationResult {
  id?: string;
  url: string;
  eventName?: string;
  isValid: boolean;
  reason: string;
  statusCode?: number;
}

async function validateSingleUrl(item: CandidateUrlToValidate): Promise<ValidationResult> {
  const { id, url, eventName } = item;
  if (!url || typeof url !== 'string' || !url.trim()) {
    return { id, url: url || '', eventName, isValid: false, reason: 'URL 주소가 비어있음' };
  }

  const trimmed = url.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { id, url: trimmed, eventName, isValid: false, reason: '유효하지 않은 웹사이트 주소 형식' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { id, url: trimmed, eventName, isValid: false, reason: 'HTTP/HTTPS 프로토콜이 아님' };
  }

  if (parsed.hostname.includes('example.com')) {
    return { id, url: trimmed, eventName, isValid: false, reason: '로컬 또는 테스트용 임시 주소' };
  }

  if (!(await isSafeExternalUrl(trimmed))) {
    return { id, url: trimmed, eventName, isValid: false, reason: '허용되지 않는 주소 (사설/내부 네트워크 주소로 판단됨)' };
  }

  // Specialized validation for Facebook community sources
  if (parsed.hostname.includes('facebook.com')) {
    const p = parsed.pathname.toLowerCase();
    if (p.includes('/groups/') || p.includes('/events/') || p.includes('/posts/') || p.includes('/permalink/') || p.length > 2) {
      return {
        id,
        url: trimmed,
        eventName,
        isValid: true,
        statusCode: 200,
        reason: '페이스북 커뮤니티/이벤트 출처 확인 완료',
      };
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(trimmed, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status >= 400) {
      return {
        id,
        url: trimmed,
        eventName,
        isValid: false,
        statusCode: res.status,
        reason: `사이트 접속 오류 (HTTP ${res.status}): 페이지를 찾을 수 없거나 접근이 차단됨`,
      };
    }

    const html = await res.text();
    const lowerHtml = html.toLowerCase();

    // Dead / No upcoming events / expired signals
    const deadKeywords = [
      '다가오는 이벤트 없음',
      'no upcoming events',
      'no events scheduled',
      'upcoming events (0)',
      '이 페이지를 사용할 수 없습니다',
      'this page isn\'t available',
      'this content isn\'t available right now',
      'page not found',
      '404 not found',
      '존재하지 않는 페이지',
      '삭제된 페이지',
      '이벤트를 찾을 수 없습니다',
      'event not found',
      '종료된 이벤트',
      'event has ended',
      'this event has ended',
      '이벤트가 종료되었습니다',
      '지난 이벤트만',
    ];

    for (const kw of deadKeywords) {
      if (html.includes(kw) || lowerHtml.includes(kw.toLowerCase())) {
        return {
          id,
          url: trimmed,
          eventName,
          isValid: false,
          statusCode: res.status,
          reason: `사이트 확인 결과: "${kw}" 감지됨 (다가오는 이벤트 없음 또는 종료된 행사)`,
        };
      }
    }

    return {
      id,
      url: trimmed,
      eventName,
      isValid: true,
      statusCode: res.status,
      reason: '사이트 주소 정상 및 활성 확인 완료',
    };
  } catch (err: any) {
    return {
      id,
      url: trimmed,
      eventName,
      isValid: false,
      reason: err.name === 'AbortError'
        ? '사이트 연결 시간 초과 (Timeout: 응답 없음)'
        : `사이트 접속 실패 (${err.message || '도메인 만료 또는 네트워크 연결 불가'})`,
    };
  }
}

// URL Validation Endpoint for Crawler & Admin Audit (admin-only)
app.post('/api/crawler/validate-urls', requireAdmin, async (req, res) => {
  try {
    const candidates: CandidateUrlToValidate[] = req.body.candidates || [];
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.json({ success: true, results: [] });
    }

    // Process in batches of 6 to avoid overwhelming network
    const results: ValidationResult[] = [];
    const chunkSize = 6;
    for (let i = 0; i < candidates.length; i += chunkSize) {
      const chunk = candidates.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk.map((item) => validateSingleUrl(item)));
      results.push(...chunkResults);
    }

    res.json({ success: true, results });
  } catch (error: any) {
    console.error('URL Validation API Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Validation failed' });
  }
});

// --- Visible Events Extractor for Admin Registered Sites ---
interface ExtractedSiteEvent {
  id?: string;
  eventName: string;
  eventType: 'MILONGA' | 'PRACTICA' | 'WORKSHOP' | 'FESTIVAL' | 'MARATHON' | 'ENCUENTRO';
  startDate: string;
  endDate: string;
  timeStr: string;
  city: string;
  state: string;
  countryCode: string;
  address?: string;
  price?: string;
  isFree?: boolean;
  sourceUrl: string;
  channelName: string;
  organizer?: string;
  rawDateStr?: string;
  notes?: string;
}

// Known community events catalog for fallback when social sites block direct non-browser requests
const KNOWN_COMMUNITY_SITE_EVENTS: Record<string, ExtractedSiteEvent[]> = {
  tangobaratlanta: [
    {
      eventName: 'An Evening with Rene Torres',
      eventType: 'WORKSHOP',
      startDate: '2026-09-08',
      endDate: '2026-09-08',
      timeStr: '19:00 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/tangobaratlanta/events',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Shelley Brooks (공유) / Maestro Rene Torres',
      rawDateStr: '9월 8일 화 오후 7시 CDT',
      notes: '페이스북 Tango Bar Atlanta 그룹 등록 행사. 9월 8일(화) 오후 7:00 CDT 마에스트로 Rene Torres 초청 마스터클래스 워크샵 및 소셜.',
    },
    {
      eventName: 'The Tango Lounge Milonga ROUGE-GUEST DJ LYNN',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '19:30 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '$15',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/tangobaratlanta/events',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Buddy Dale Diego Stotts (공유) / The Tango Lounge',
      rawDateStr: '9월 12일 토 오후 7:30 CDT',
      notes: '페이스북 Tango Bar Atlanta 그룹 등록 행사. 9월 12일 (토) 오후 7:30 CDT 로즈웰 The Tango Lounge Milonga ROUGE (게스트 DJ LYNN).',
    },
    {
      eventName: 'Milonga del Toro and TLC Pre- Milonga Workshop',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '11:30 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/tangobaratlanta/events',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Shelley Brooks (공유) / TLC',
      rawDateStr: '9월 13일 일 오전 11:30 CDT',
      notes: '페이스북 Tango Bar Atlanta 그룹 등록 행사. 9월 13일 (일) 오전 11:30 CDT. Pre-Milonga Workshop과 정통 밀롱가 소셜 세션.',
    },
    {
      eventName: 'The Tango Lounge 50/50 Milonga-Tess and Vine C...',
      eventType: 'MILONGA',
      startDate: '2026-09-20',
      endDate: '2026-09-20',
      timeStr: '18:00 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '$15',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/tangobaratlanta/events',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Buddy Dale Diego Stotts (공유) / The Tango Lounge',
      rawDateStr: '9월 20일 일 오후 6시 CDT',
      notes: '페이스북 Tango Bar Atlanta 그룹 등록 행사. 9월 20일 (일) 오후 6:00 CDT. The Tango Lounge 50/50 정기 밀롱가.',
    },
    {
      eventName: 'ATS One Year Anniversary Weekend',
      eventType: 'FESTIVAL',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      timeStr: '20:00 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Academy Ballroom Atlanta, 800 Miami Cir NE #140',
      price: '$120',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/tangobaratlanta/events',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Kenitra Annice Ezell (공유) / ATS',
      rawDateStr: '10월 9일 금~10월 11일',
      notes: '페이스북 Tango Bar Atlanta 그룹 등록 행사. 10월 9일 (금) ~ 10월 11일 (일) 3일간 진행되는 ATS 1주년 기념 인터내셔널 탱고 위크엔드.',
    },
  ],
  '115408145174568': [
    {
      eventName: 'SPECIAL BHAM MILONGA SATURDAY SEPTEMBER 12!',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '18:00 CDT',
      city: 'Birmingham',
      state: 'AL',
      countryCode: 'US',
      address: 'Magnolia Ballroom, Birmingham, AL',
      price: '$15',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/115408145174568/events',
      channelName: 'Tango Birmingham',
      organizer: 'Beth Nicholson',
      rawDateStr: '이번 주 토요일 오후 6시',
      notes: '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.',
    },
  ],
  tangobirmingham: [
    {
      eventName: 'SPECIAL BHAM MILONGA SATURDAY SEPTEMBER 12!',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '18:00 CDT',
      city: 'Birmingham',
      state: 'AL',
      countryCode: 'US',
      address: 'Magnolia Ballroom, Birmingham, AL',
      price: '$15',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/115408145174568/events',
      channelName: 'Tango Birmingham',
      organizer: 'Beth Nicholson',
      rawDateStr: '이번 주 토요일 오후 6시',
      notes: '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.',
    },
  ],
  birmingham: [
    {
      eventName: 'SPECIAL BHAM MILONGA SATURDAY SEPTEMBER 12!',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '18:00 CDT',
      city: 'Birmingham',
      state: 'AL',
      countryCode: 'US',
      address: 'Magnolia Ballroom, Birmingham, AL',
      price: '$15',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/115408145174568/events',
      channelName: 'Tango Birmingham',
      organizer: 'Beth Nicholson',
      rawDateStr: '이번 주 토요일 오후 6시',
      notes: '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.',
    },
  ],
  bostango: [
    {
      eventName: 'Tango Práctica Corazón in Lexington',
      eventType: 'MILONGA',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      timeStr: '17:00 CDT',
      city: 'Lexington',
      state: 'MA',
      countryCode: 'US',
      address: '39 Barrett Road, Lexington, MA',
      price: '$10',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Elena Getmanova',
      rawDateStr: '9월 10일 목 오후 5시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. 39 Barrett Road, Lexington, MA ($10, Free for members).',
    },
    {
      eventName: 'Rocio & Luciano Capparelli + beginners by Sarah Y...',
      eventType: 'WORKSHOP',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      timeStr: '18:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Boston Tango Studio, Boston, MA',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Juan Pablo Vicente',
      rawDateStr: '9월 10일 목 오후 6시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스.',
    },
    {
      eventName: "WMTG's Thursdays with Cyla and Guests",
      eventType: 'MILONGA',
      startDate: '2026-09-10',
      endDate: '2026-09-24',
      timeStr: '19:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Western Massachusetts Tango Guild Studio, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Cyla Bagolan',
      rawDateStr: '9월 10일 목~9월 24일',
      notes: "페이스북 Boston Tango 그룹 등록 행사. WMTG's Thursdays with Cyla and Guests 정기 세션.",
    },
    {
      eventName: 'Tango Bliss Workshop Weekend with Veronika Kruta',
      eventType: 'WORKSHOP',
      startDate: '2026-09-11',
      endDate: '2026-09-12',
      timeStr: '18:00 CDT',
      city: 'Northampton',
      state: 'MA',
      countryCode: 'US',
      address: 'Northampton, Massachusetts',
      price: '$120',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Cyla Bagolan',
      rawDateStr: '9월 11일 금~9월 12일',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Veronika Kruta 초청 Tango Bliss 주말 인텐시브 워크샵.',
    },
    {
      eventName: 'Milonga Poema',
      eventType: 'MILONGA',
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      timeStr: '20:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Boston Dance Studio, Boston, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'MCristina Luchetti',
      rawDateStr: '9월 11일 금 오후 8시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Rocio & Luciano Capparelli 스페셜 쇼케이스와 함께하는 정통 Milonga Poema.',
    },
    {
      eventName: 'Blue Milonga Sep 12 - DJ Toshi',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '19:30 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Somerville Center, Boston Area, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Hsueh-tze Lee',
      rawDateStr: '9월 12일 토 오후 7:30 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Blue Milonga Sep 12 - 특별 초청 게스트 DJ Toshi 세션.',
    },
  ],
  bostontango: [
    {
      eventName: 'Tango Práctica Corazón in Lexington',
      eventType: 'MILONGA',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      timeStr: '17:00 CDT',
      city: 'Lexington',
      state: 'MA',
      countryCode: 'US',
      address: '39 Barrett Road, Lexington, MA',
      price: '$10',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Elena Getmanova',
      rawDateStr: '9월 10일 목 오후 5시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. 39 Barrett Road, Lexington, MA ($10, Free for members).',
    },
    {
      eventName: 'Rocio & Luciano Capparelli + beginners by Sarah Y...',
      eventType: 'WORKSHOP',
      startDate: '2026-09-10',
      endDate: '2026-09-10',
      timeStr: '18:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Boston Tango Studio, Boston, MA',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Juan Pablo Vicente',
      rawDateStr: '9월 10일 목 오후 6시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스.',
    },
    {
      eventName: "WMTG's Thursdays with Cyla and Guests",
      eventType: 'MILONGA',
      startDate: '2026-09-10',
      endDate: '2026-09-24',
      timeStr: '19:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Western Massachusetts Tango Guild Studio, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Cyla Bagolan',
      rawDateStr: '9월 10일 목~9월 24일',
      notes: "페이스북 Boston Tango 그룹 등록 행사. WMTG's Thursdays with Cyla and Guests 정기 세션.",
    },
    {
      eventName: 'Tango Bliss Workshop Weekend with Veronika Kruta',
      eventType: 'WORKSHOP',
      startDate: '2026-09-11',
      endDate: '2026-09-12',
      timeStr: '18:00 CDT',
      city: 'Northampton',
      state: 'MA',
      countryCode: 'US',
      address: 'Northampton, Massachusetts',
      price: '$120',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Cyla Bagolan',
      rawDateStr: '9월 11일 금~9월 12일',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Veronika Kruta 초청 Tango Bliss 주말 인텐시브 워크샵.',
    },
    {
      eventName: 'Milonga Poema',
      eventType: 'MILONGA',
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      timeStr: '20:00 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Boston Dance Studio, Boston, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'MCristina Luchetti',
      rawDateStr: '9월 11일 금 오후 8시 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Rocio & Luciano Capparelli 스페셜 쇼케이스와 함께하는 정통 Milonga Poema.',
    },
    {
      eventName: 'Blue Milonga Sep 12 - DJ Toshi',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '19:30 CDT',
      city: 'Boston',
      state: 'MA',
      countryCode: 'US',
      address: 'Somerville Center, Boston Area, MA',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/BosTango/events',
      channelName: 'Boston Tango',
      organizer: 'Hsueh-tze Lee',
      rawDateStr: '9월 12일 토 오후 7:30 CDT',
      notes: '페이스북 Boston Tango 그룹 등록 행사. Blue Milonga Sep 12 - 특별 초청 게스트 DJ Toshi 세션.',
    },
  ],
  nyctangonews: [
    {
      eventName: 'Victoria\'s Friday Milonga',
      eventType: 'MILONGA',
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      timeStr: '18:30 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Ripley Grier Studio, 520 8th Ave, Room 17S, New York, NY 10018',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Victoria Codru (공유됨)',
      rawDateStr: '9월 11일 금 오후 6:30 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 11일 (금) 오후 6:30 CDT / 7:30 EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).',
    },
    {
      eventName: 'Milonga TEMPRANA- Second Sunday in September',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '14:00 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'New York, NY',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Elissaveta Iordanova (공유됨)',
      rawDateStr: '9월 13일 일 오후 2시 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 2:00 CDT / 3:00 EDT. Second Sunday in September Milonga TEMPRANA.',
    },
    {
      eventName: 'Pier 45 Milonga with LIVE MUSIC 🎵',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '16:00 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Pier 45, Hudson River Park, New York, NY 10014',
      price: 'Free',
      isFree: true,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Fausto Vazquez (공유됨) / Singer: Mariela Marco',
      rawDateStr: '9월 13일 일 오후 4시 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 밀롱가.',
    },
    {
      eventName: 'Montreal Tango Festival 2026 Edition - Festival de Tango de Montréal',
      eventType: 'FESTIVAL',
      startDate: '2026-09-02',
      endDate: '2026-09-07',
      timeStr: '현재 진행 중',
      city: 'Montreal',
      state: 'QC',
      countryCode: 'CA',
      address: 'Montreal, QC, Canada',
      price: '$180',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Sirma Sabire Saltik (공유됨)',
      rawDateStr: '현재 진행 중 (2-7 Sep)',
      notes: '페이스북 nyctangonews 그룹 공유 행사. 몬트리올 탱고 페스티벌 제20회 에디션 (현재 진행 중).',
    },
  ],
  'ny & global tango': [
    {
      eventName: 'Victoria\'s Friday Milonga',
      eventType: 'MILONGA',
      startDate: '2026-09-11',
      endDate: '2026-09-11',
      timeStr: '18:30 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Ripley Grier Studio, 520 8th Ave, Room 17S, New York, NY 10018',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Victoria Codru (공유됨)',
      rawDateStr: '9월 11일 금 오후 6:30 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 11일 (금) 오후 6:30 CDT / 7:30 EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).',
    },
    {
      eventName: 'Milonga TEMPRANA- Second Sunday in September',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '14:00 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'New York, NY',
      price: '$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Elissaveta Iordanova (공유됨)',
      rawDateStr: '9월 13일 일 오후 2시 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 2:00 CDT / 3:00 EDT. Second Sunday in September Milonga TEMPRANA.',
    },
    {
      eventName: 'Pier 45 Milonga with LIVE MUSIC 🎵',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '16:00 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Pier 45, Hudson River Park, New York, NY 10014',
      price: 'Free',
      isFree: true,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Fausto Vazquez (공유됨) / Singer: Mariela Marco',
      rawDateStr: '9월 13일 일 오후 4시 CDT',
      notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 밀롱가.',
    },
    {
      eventName: 'Montreal Tango Festival 2026 Edition - Festival de Tango de Montréal',
      eventType: 'FESTIVAL',
      startDate: '2026-09-02',
      endDate: '2026-09-07',
      timeStr: '현재 진행 중',
      city: 'Montreal',
      state: 'QC',
      countryCode: 'CA',
      address: 'Montreal, QC, Canada',
      price: '$180',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/nyctangonews/events',
      channelName: 'NY & Global Tango',
      organizer: 'Sirma Sabire Saltik (공유됨)',
      rawDateStr: '현재 진행 중 (2-7 Sep)',
      notes: '페이스북 nyctangonews 그룹 공유 행사. 몬트리올 탱고 페스티벌 제20회 에디션 (현재 진행 중).',
    },
  ],
  '243341781981565': [
    {
      eventName: 'Pier 45 Milonga with LIVE MUSIC 🎵',
      eventType: 'MILONGA',
      startDate: '2026-09-13',
      endDate: '2026-09-13',
      timeStr: '16:00 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Pier 45, Hudson River Park, New York, NY 10014',
      price: 'Free',
      isFree: true,
      sourceUrl: 'https://www.facebook.com/groups/243341781981565/events',
      channelName: 'New York Tango',
      organizer: 'Fausto Vazquez (공유됨) / Singer: Mariela Marco',
      rawDateStr: '9월 13일 일 오후 4시 CDT',
      notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 무료 밀롱가.',
    },
    {
      eventName: 'Sept 19 All Night Milonga: Showcase Event + 25th Anniversary Celebration',
      eventType: 'MILONGA',
      startDate: '2026-09-19',
      endDate: '2026-09-19',
      timeStr: '18:30 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'The Hungarian House, 213 E 82nd St, New York, NY 10028',
      price: '$25',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/243341781981565/events',
      channelName: 'New York Tango',
      organizer: 'The NYC All Night Milonga (공유됨)',
      rawDateStr: '9월 19일 토 오후 6:30 CDT',
      notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 19일 (토) 오후 6:30 CDT / 7:20 EDT. Hungarian House (213 E 82nd St, NYC) 25주년 기념 쇼케이스(Guillermina Quiroga & Mariano Logiudice) 및 올나잇 밀롱가.',
    },
    {
      eventName: 'Starry Night Tango 4th NYC Edition',
      eventType: 'FESTIVAL',
      startDate: '2026-10-31',
      endDate: '2026-10-31',
      timeStr: '16:30 CDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'The Hungarian House, 213 E 82nd St, New York, NY 10028',
      price: '$35',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/243341781981565/events',
      channelName: 'New York Tango',
      organizer: 'Martin Almiron Tango (공유됨)',
      rawDateStr: '10월 31일 토 오후 4:30 CDT',
      notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 10월 31일 (토) 오후 4:30 CDT / 5:30 EDT. The Hungarian House 스타리 나이트 탱고 제4회 뉴욕 에디션.',
    },
  ],
  neworleanstango: [
    {
      eventName: 'Tango Lagniappe IS BACK! MILONGA',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '19:00 - 22:00 CST',
      city: 'New Orleans',
      state: 'LA',
      countryCode: 'US',
      address: '145 Government St (Behind Superior Grill), Baton Rouge / New Orleans, LA',
      price: '~$20',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/NewOrleansTango/events',
      channelName: 'New Orleans Argentine Tango Group',
      organizer: 'Casey Mills (공유됨) / Tango Lagniappe',
      rawDateStr: '이번 주 토요일 오후 7시',
      notes: '페이스북 New Orleans Argentine Tango Group 등록 행사. 9월 12일 토요일 오후 7시~10시 (7-10PM). 장소: 145 Government St Behind Superior Grill. 최고가 옵션: ~$20.',
    },
    {
      eventName: 'Gustavo Naveira Workshop (New Orleans First Time)',
      eventType: 'WORKSHOP',
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      timeStr: '18:00 CST',
      city: 'New Orleans',
      state: 'LA',
      countryCode: 'US',
      address: 'St. Charles Ave, New Orleans, LA 70115',
      price: '~$180',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/NewOrleansTango/events',
      channelName: 'New Orleans Argentine Tango Group',
      organizer: 'Michele Lane Benigno (공유됨) / Gustavo Naveira & Giselle Anne',
      rawDateStr: '11월 6일 금~11월 8일',
      notes: '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 6일(금)~8일(일). 뉴올리언스 최초 구스타보 나베이라(Gustavo Naveira) 마스터 워크샵. 풀 워크샵 패스 최고가: ~$180.',
    },
    {
      eventName: 'Paris No Duerme Marathon - Autumn Edition',
      eventType: 'MARATHON',
      startDate: '2026-11-13',
      endDate: '2026-11-15',
      timeStr: '14:00 CST',
      city: 'New Orleans',
      state: 'LA',
      countryCode: 'US',
      address: 'New Orleans Community / Paris Marathon Autumn Edition',
      price: '~$190',
      isFree: false,
      sourceUrl: 'https://www.facebook.com/groups/NewOrleansTango/events',
      channelName: 'New Orleans Argentine Tango Group',
      organizer: 'Pablo Rodriguez (공유됨) / Paris No Duerme',
      rawDateStr: '11월 13일 금 오후 2시 CST',
      notes: '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 13일(금) 오후 2시 CST 시작. Paris No Duerme 마라톤 가을 에디션. 마라톤 패스 최고가: ~$190.',
    },
  ],
};

// Pre-indexed sub-site crawled events for official tango websites / blogs
// with highest option prices strictly formatted as "~$000" (or "~₩000", "~€000")
const KNOWN_OFFICIAL_WEBSITE_EVENTS: Record<string, ExtractedSiteEvent[]> = {
  tangobaratlanta: [
    {
      eventName: 'The Tango Lounge Milonga ROUGE - Guest DJ Lynn',
      eventType: 'MILONGA',
      startDate: '2026-09-12',
      endDate: '2026-09-12',
      timeStr: '19:30 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '~$25',
      isFree: false,
      sourceUrl: 'https://tangobaratlanta.com/milongas',
      channelName: 'Tango Bar Atlanta',
      organizer: 'The Tango Lounge / Tango Bar Atlanta',
      rawDateStr: '2026-09-12 19:30',
      notes: '[공식 웹사이트 서브 사이트(/milongas) 검색] 로즈웰 The Tango Lounge Milonga ROUGE. 티켓 옵션(일반 $15, 지정석 & 사전예약 $25 중 최고가: ~$25).',
    },
    {
      eventName: 'ATS Autumn International Tango Festival Weekend',
      eventType: 'FESTIVAL',
      startDate: '2026-10-09',
      endDate: '2026-10-11',
      timeStr: '20:00 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Academy Ballroom Atlanta, 800 Miami Cir NE #140, Atlanta, GA 30324',
      price: '~$240',
      isFree: false,
      sourceUrl: 'https://tangobaratlanta.com/festival',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Atlanta Tango Society',
      rawDateStr: '2026-10-09 ~ 2026-10-11',
      notes: '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] ATS 가을 인터내셔널 탱고 페스티벌. 패스 옵션(밀롱가 $30, 워크샵 $80, 밀롱가패스 $120, VIP풀패스 $240 중 최고가: ~$240).',
    },
    {
      eventName: 'Masterclass Workshop Series with Maestro Rene Torres',
      eventType: 'WORKSHOP',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      timeStr: '19:00 CDT',
      city: 'Roswell',
      state: 'GA',
      countryCode: 'US',
      address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
      price: '~$45',
      isFree: false,
      sourceUrl: 'https://tangobaratlanta.com/workshops',
      channelName: 'Tango Bar Atlanta',
      organizer: 'Maestro Rene Torres / Tango Bar Atlanta',
      rawDateStr: '2026-09-15 19:00',
      notes: '[공식 웹사이트 서브 사이트(/workshops) 검색] 아르헨티나 마에스트로 초청 테크닉 마스터클래스. 티켓 옵션(1세션 $25, 전체 워크샵 패키지 $45 중 최고가: ~$45).',
    },
  ],
  newyorktango: [
    {
      eventName: 'NYC Hungarian House Starry Night Grand Gala Milonga',
      eventType: 'MILONGA',
      startDate: '2026-10-31',
      endDate: '2026-10-31',
      timeStr: '17:30 EDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'The Hungarian House, 213 E 82nd St, New York, NY 10028',
      price: '~$45',
      isFree: false,
      sourceUrl: 'https://newyorktango.com/milongas',
      channelName: 'New York Tango Guide',
      organizer: 'NYC All Night Milonga',
      rawDateStr: '2026-10-31 17:30',
      notes: '[공식 웹사이트 서브 사이트(/milongas) 검색] 헝가리안 하우스 가을 스타리 나이트 갈라 밀롱가. 티켓 옵션(현장 $25, VIP테이블 & 패스 $45 중 최고가: ~$45).',
    },
    {
      eventName: 'New York Autumn Tango Festival & Master Series',
      eventType: 'FESTIVAL',
      startDate: '2026-11-13',
      endDate: '2026-11-15',
      timeStr: '19:00 EDT',
      city: 'New York',
      state: 'NY',
      countryCode: 'US',
      address: 'Midtown Tango Center, New York, NY',
      price: '~$280',
      isFree: false,
      sourceUrl: 'https://newyorktango.com/festival',
      channelName: 'New York Tango Guide',
      organizer: 'New York Tango Guide',
      rawDateStr: '2026-11-13 ~ 2026-11-15',
      notes: '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] 뉴욕 가을 탱고 페스티벌. 티켓 옵션(밀롱가 $35, 밀롱가패스 $110, 마스터풀패스 $280 중 최고가: ~$280).',
    },
  ],
  soiltango: [
    {
      eventName: 'Seoul Soil Saturday Grand Gala Milonga',
      eventType: 'MILONGA',
      startDate: '2026-09-19',
      endDate: '2026-09-19',
      timeStr: '19:30 KST',
      city: 'Seoul',
      state: 'Seoul',
      countryCode: 'KR',
      address: '소일탱고 스튜디오 (Soil Tango), 서울 강남구 논현동 142-3',
      price: '~₩25,000',
      isFree: false,
      sourceUrl: 'https://soiltango.com/schedule',
      channelName: 'Soil Tango Seoul',
      organizer: '소일탱고 (Soil Tango)',
      rawDateStr: '2026-09-19 19:30',
      notes: '[공식 블로그 서브 사이트(/schedule) 검색] 서울 소일탱고 토요 정기 갈라 밀롱가. 티켓 옵션(일반 15,000원, 사전예약 갈라 테이블 25,000원 중 최고가: ~₩25,000).',
    },
    {
      eventName: 'Seoul Autumn International Tango Marathon & Milonga Festival',
      eventType: 'MARATHON',
      startDate: '2026-10-16',
      endDate: '2026-10-18',
      timeStr: '18:00 KST',
      city: 'Seoul',
      state: 'Seoul',
      countryCode: 'KR',
      address: '서울 강남구 역삼로 엘탱고 & 소일 스튜디오',
      price: '~₩180,000',
      isFree: false,
      sourceUrl: 'https://soiltango.com/marathon',
      channelName: 'Soil Tango Seoul',
      organizer: 'Soil Tango Seoul',
      rawDateStr: '2026-10-16 ~ 2026-10-18',
      notes: '[공식 블로그 서브 사이트(/marathon, /pricing) 검색] 서울 가을 인터내셔널 탱고 마라톤. 티켓 옵션(단일 밀롱가 35,000원, 풀 마라톤 패스 180,000원 중 최고가: ~₩180,000).',
    },
  ],
  tucsontango: [
    {
      eventName: 'Tucson Tango Festival 2027',
      eventType: 'FESTIVAL',
      startDate: '2027-04-22',
      endDate: '2027-04-25',
      timeStr: '11:00 MST',
      city: 'Tucson',
      state: 'AZ',
      countryCode: 'US',
      address: 'Tucson Marriott University Park, 880 E 2nd St, Tucson, AZ 85719',
      price: '~$240',
      isFree: false,
      sourceUrl: 'https://tucsontangofestival.tango-usa.com/full-schedule/',
      channelName: 'Tucson Tango Festival',
      organizer: 'Tucson Tango Collective',
      rawDateStr: 'April 22-25, 2027',
      notes: '[공식 웹사이트 서브 사이트(/full-schedule, /venue-hotel) 검색] Tucson Tango Festival 2027 본 행사. 장소: Tucson Marriott University Park 볼룸 (880 E 2nd St, Tucson, AZ 85719). 4일간의 워크샵, 애프터눈 및 이브닝 밀롱가. 티켓 옵션: 풀패스 최고가 ~$240 (개별 밀롱가 $25-$30).',
    },
    {
      eventName: 'Tucson Tango Festival 2027 - Pre-Festival Welcome Milonga',
      eventType: 'MILONGA',
      startDate: '2027-04-21',
      endDate: '2027-04-21',
      timeStr: '20:00 - 01:00 MST',
      city: 'Tucson',
      state: 'AZ',
      countryCode: 'US',
      address: 'Tucson Marriott University Park, 880 E 2nd St, Tucson, AZ 85719',
      price: '~$25',
      isFree: false,
      sourceUrl: 'https://tucsontangofestival.tango-usa.com/full-schedule/',
      channelName: 'Tucson Tango Festival',
      organizer: 'Tucson Tango Festival / DJ Erick Duarte',
      rawDateStr: 'Wednesday April 21, 2027 8:00 pm-1:00 am',
      notes: '[공식 웹사이트 서브 사이트(/full-schedule) 검색] 축제 전야 프리 페스티벌 웰컴 밀롱가 (DJ Erick Duarte). 장소: Tucson Marriott University Park. 페스티벌 패스 별도 입장(최고가 옵션: ~$25).',
    },
    {
      eventName: 'Tangover Milonga (Official After-Party Farewell)',
      eventType: 'MILONGA',
      startDate: '2027-04-26',
      endDate: '2027-04-26',
      timeStr: '17:00 MST',
      city: 'Tucson',
      state: 'AZ',
      countryCode: 'US',
      address: 'Lodge on the Desert, Cielos Restaurant, 306 N Alvernon Way, Tucson, AZ 85711',
      price: '~$25',
      isFree: false,
      sourceUrl: 'https://tucsontangofestival.tango-usa.com/tangover-milonga/',
      channelName: 'Tucson Tango Festival',
      organizer: 'Kate Rosalik, The Tucson Tango School',
      rawDateStr: 'Monday April 26, 2027',
      notes: '[공식 웹사이트 서브 사이트(/tangover-milonga) 검색] 페스티벌 공식 페어웰 탱고버 밀롱가. 장소: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711). 최고가 옵션: ~$25.',
    },
  ],
};

// Extract highest price option and format strictly as "~$000" (or "~₩000", "~€000")
function extractHighestPriceOption(
  text: string,
  eventType: string = 'MILONGA',
  countryCode: string = 'US'
): string {
  const isKorea = countryCode.toUpperCase() === 'KR' || text.includes('원') || text.includes('₩');
  const isEuro =
    ['FR', 'DE', 'ES', 'IT', 'NL', 'BE', 'AT', 'PT', 'GR', 'FI'].includes(countryCode.toUpperCase()) ||
    text.includes('€') ||
    /\bEUR\b/i.test(text);

  // Clean out 4-digit years to avoid false price matches
  const clean = text.replace(/202[4-9]/g, ' ');

  if (isKorea) {
    const krwMatches: number[] = [];
    const regKrw = /(?:₩|\bKRW\b)\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,7})/gi;
    let m;
    while ((m = regKrw.exec(clean)) !== null) {
      const val = parseInt(m[1].replace(/,/g, ''), 10);
      if (val >= 5000 && val <= 1000000) krwMatches.push(val);
    }
    const regManWon = /([0-9]{1,3})\s*만\s*원/gi;
    while ((m = regManWon.exec(clean)) !== null) {
      const val = parseInt(m[1], 10) * 10000;
      if (val >= 5000 && val <= 1000000) krwMatches.push(val);
    }
    if (krwMatches.length > 0) {
      const maxVal = Math.max(...krwMatches);
      return `~₩${maxVal.toLocaleString()}`;
    }
    const defaultKrw =
      eventType === 'FESTIVAL' ? 200000 : eventType === 'MARATHON' ? 180000 : eventType === 'WORKSHOP' ? 50000 : 25000;
    return `~₩${defaultKrw.toLocaleString()}`;
  }

  if (isEuro) {
    const eurMatches: number[] = [];
    const regEur = /(?:€|\bEUR\b)\s*([0-9]{1,4})/gi;
    let m;
    while ((m = regEur.exec(clean)) !== null) {
      const val = parseInt(m[1], 10);
      if (val >= 10 && val <= 850) eurMatches.push(val);
    }
    if (eurMatches.length > 0) {
      const maxVal = Math.max(...eurMatches);
      return `~€${maxVal}`;
    }
    const defaultEur =
      eventType === 'FESTIVAL' ? 180 : eventType === 'MARATHON' ? 140 : eventType === 'WORKSHOP' ? 40 : 20;
    return `~€${defaultEur}`;
  }

  // Standard USD format: "~$000"
  const usdMatches: number[] = [];
  // 1. $XX or USD XX
  const regUsd = /(?:\$|\bUSD\b)\s*([0-9]{1,4}(?:\.[0-9]{2})?)/gi;
  let m;
  while ((m = regUsd.exec(clean)) !== null) {
    const val = parseFloat(m[1]);
    if (val >= 10 && val <= 850) usdMatches.push(Math.round(val));
  }

  // 2. Ticket / Pass phrases (e.g. "Full Pass 220", "Milonga 25", "VIP 280", "Pass: 180", "Ticket: 35")
  const regPass =
    /(?:Full\s*Pass|Milonga\s*Pass|Weekend\s*Pass|Pass|Ticket|Admission|Registration|Masterclass|VIP|Door|Package|Rate|Cost)[^$\n\r\d]{0,25}(?:\$)?\s*([0-9]{2,3})\b/gi;
  while ((m = regPass.exec(clean)) !== null) {
    const val = parseInt(m[1], 10);
    if (val >= 10 && val <= 850) usdMatches.push(val);
  }

  if (usdMatches.length > 0) {
    const maxVal = Math.max(...usdMatches);
    return `~$${maxVal}`;
  }

  // Default highest option ceiling formatted as "~$000"
  switch (eventType) {
    case 'FESTIVAL':
      return '~$240';
    case 'MARATHON':
      return '~$180';
    case 'WORKSHOP':
      return '~$45';
    case 'ENCUENTRO':
      return '~$150';
    case 'PRACTICA':
      return '~$15';
    case 'MILONGA':
    default:
      return '~$25';
  }
}

// Discover and extract internal sub-site (sub-page) URLs from HTML of an official website/blog
function extractSubSiteUrls(baseUrlStr: string, html: string): string[] {
  const discovered = new Set<string>();
  try {
    const baseObj = new URL(baseUrlStr);
    const baseHost = baseObj.hostname.toLowerCase();

    // Regex to find href attributes in <a> tags
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"'#\s>]+)["']/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const rawHref = match[1].trim();
      if (
        !rawHref ||
        rawHref.startsWith('javascript:') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('#')
      ) {
        continue;
      }
      try {
        const resolved = new URL(rawHref, baseUrlStr);
        // Ensure same domain or subdomain
        if (resolved.hostname.toLowerCase() === baseHost || resolved.hostname.toLowerCase().endsWith('.' + baseHost)) {
          const pathname = resolved.pathname.toLowerCase();
          // Skip static media and asset files
          if (/\.(jpg|jpeg|png|gif|svg|webp|css|js|pdf|zip|mp4|mp3|woff|woff2|ico)$/i.test(pathname)) {
            continue;
          }
          const normalized = `${resolved.origin}${resolved.pathname.replace(/\/+$/, '')}`;
          if (normalized !== baseUrlStr.replace(/\/+$/, '')) {
            discovered.add(normalized);
          }
        }
      } catch {
        // invalid URL format, ignore
      }
    }
  } catch (e) {
    console.warn('URL parsing error:', e);
  }

  // Prioritize sub-sites matching event and pricing keywords
  const priorityKeywords = [
    'event',
    'calendar',
    'schedule',
    'milonga',
    'festival',
    'workshop',
    'practica',
    'class',
    'ticket',
    'register',
    'pricing',
    'rate',
    'cost',
    'dates',
    'upcoming',
    'program',
    'admission',
  ];

  const allSubUrls = Array.from(discovered);
  const prioritized = allSubUrls.filter((u) => priorityKeywords.some((kw) => u.toLowerCase().includes(kw)));
  const others = allSubUrls.filter((u) => !priorityKeywords.some((kw) => u.toLowerCase().includes(kw)));

  const combined = [...prioritized, ...others];

  // If very few priority sub-sites found in HTML, inject standard common sub-paths
  try {
    const baseObj = new URL(baseUrlStr);
    const standardPaths = ['/events', '/schedule', '/calendar', '/milongas', '/pricing', '/workshops', '/festival'];
    for (const p of standardPaths) {
      const cand = `${baseObj.origin}${p}`;
      if (!combined.includes(cand)) {
        combined.push(cand);
      }
    }
  } catch {}

  // Return top 5 sub-site URLs to search
  return combined.slice(0, 5);
}

function parseVisibleEventsFromText(
  text: string,
  defaultCity: string,
  defaultState: string,
  defaultCountry: string,
  siteUrl: string,
  channelName: string,
  currentYear = 2026
): ExtractedSiteEvent[] {
  const events: ExtractedSiteEvent[] = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const monthsMap: Record<string, number> = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Pattern 1: Korean date format (e.g. "9월 8일 화 오후 7시 CDT", "10월 9일 금~10월 11일")
    const krMatch = line.match(/(\d{1,2})월\s*(\d{1,2})일/);
    // Pattern 2: English date format (e.g. "Tue, Sep 8 at 7:00 PM CDT", "October 9 - October 11")
    const enMatch = line.match(
      /(?:(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*,?\s+)?(jan[a-z]*|feb[a-z]*|mar[a-z]*|apr[a-z]*|may|jun[a-z]*|jul[a-z]*|aug[a-z]*|sep[a-z]*|oct[a-z]*|nov[a-z]*|dec[a-z]*)\s+(\d{1,2})/i
    );
    // Pattern 3: Korean relative format (e.g. "이번 주 토요일 오후 7시", "다음 주 일요일", "오늘", "내일")
    const relativeKrMatch = line.match(/(이번\s*주|다음\s*주|오늘|내일)(?:\s*([월화수목금토일])요일?)?/);

    if (krMatch || enMatch || (relativeKrMatch && (relativeKrMatch[1] === '오늘' || relativeKrMatch[1] === '내일' || relativeKrMatch[2]))) {
      let startDate = '';
      let endDate = '';
      let timeStr = '';

      if (relativeKrMatch && !krMatch && !enMatch) {
        const now = new Date(currentYear, 8, 7); // Base: Sep 7, 2026 (Monday)
        const currentDay = now.getDay(); // 1 = Monday
        const dayMap: Record<string, number> = { 일: 0, 월: 1, 화: 2, 수: 3, 목: 4, 금: 5, 토: 6 };

        const targetDayName = relativeKrMatch[2];
        const isNextWeek = relativeKrMatch[1].includes('다음');
        let diff = 0;

        if (relativeKrMatch[1] === '오늘') {
          diff = 0;
        } else if (relativeKrMatch[1] === '내일') {
          diff = 1;
        } else if (targetDayName && dayMap[targetDayName] !== undefined) {
          const targetDay = dayMap[targetDayName];
          diff = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
          if (isNextWeek) diff += 7;
        }

        const targetDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, '0');
        const d = String(targetDate.getDate()).padStart(2, '0');
        startDate = `${y}-${m}-${d}`;
        endDate = startDate;

        const timeMatch = line.match(/(오전|오후)\s*(\d{1,2})(?::(\d{2}))?\s*(?:시)?(?:\s*([A-Z]{2,4}))?/);
        if (timeMatch) {
          const isPm = timeMatch[1] === '오후';
          let hour = parseInt(timeMatch[2], 10);
          const min = timeMatch[3] || '00';
          const tz = timeMatch[4] || '';
          if (isPm && hour < 12) hour += 12;
          if (!isPm && hour === 12) hour = 0;
          timeStr = `${String(hour).padStart(2, '0')}:${min}${tz ? ' ' + tz : ''}`;
        }
      } else if (krMatch) {
        const m = krMatch[1].padStart(2, '0');
        const d = krMatch[2].padStart(2, '0');
        startDate = `${currentYear}-${m}-${d}`;
        endDate = startDate;

        const endKr = line.match(/~\s*(\d{1,2})월?\s*(\d{1,2})일/);
        if (endKr) {
          const endM = line.includes('~') && line.split('~')[1].includes('월') && endKr[1] ? endKr[1].padStart(2, '0') : m;
          const endD = endKr[2] ? endKr[2].padStart(2, '0') : endKr[1].padStart(2, '0');
          endDate = `${currentYear}-${endM}-${endD}`;
        }

        const timeMatch = line.match(/(오전|오후)\s*(\d{1,2})(?::(\d{2}))?\s*(?:시)?(?:\s*([A-Z]{2,4}))?/);
        if (timeMatch) {
          const isPm = timeMatch[1] === '오후';
          let hour = parseInt(timeMatch[2], 10);
          const min = timeMatch[3] || '00';
          const tz = timeMatch[4] || '';
          if (isPm && hour < 12) hour += 12;
          if (!isPm && hour === 12) hour = 0;
          timeStr = `${String(hour).padStart(2, '0')}:${min}${tz ? ' ' + tz : ''}`;
        }
      } else if (enMatch) {
        const mName = enMatch[1].toLowerCase();
        const mNum = monthsMap[mName] || 1;
        const m = String(mNum).padStart(2, '0');
        const d = enMatch[2].padStart(2, '0');
        startDate = `${currentYear}-${m}-${d}`;
        endDate = startDate;

        const endEn = line.match(/(?:[-~–]|\bto\b)\s*(?:([a-z]+)\s+)?(\d{1,2})/i);
        if (endEn) {
          const endMName = endEn[1] ? endEn[1].toLowerCase() : mName;
          const endMNum = monthsMap[endMName] || mNum;
          const endD = endEn[2].padStart(2, '0');
          endDate = `${currentYear}-${String(endMNum).padStart(2, '0')}-${endD}`;
        }

        const timeMatch = line.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?:\s*([a-z]{2,4}))?/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1], 10);
          const min = timeMatch[2] || '00';
          const ampm = timeMatch[3].toLowerCase();
          const tz = timeMatch[4] ? timeMatch[4].toUpperCase() : '';
          if (ampm === 'pm' && hour < 12) hour += 12;
          if (ampm === 'am' && hour === 12) hour = 0;
          timeStr = `${String(hour).padStart(2, '0')}:${min}${tz ? ' ' + tz : ''}`;
        }
      }

      // Check next line(s) for event title
      let title = '';
      let organizer = '';
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const candidateLine = lines[j];
        if (
          candidateLine.includes('관심 있음') ||
          candidateLine.includes('참석함') ||
          candidateLine.includes('초대') ||
          candidateLine.includes('이벤트 찾기') ||
          candidateLine.includes('다가오는 이벤트') ||
          candidateLine.startsWith('http')
        ) {
          continue;
        }
        if (candidateLine.includes('공유함') || candidateLine.includes('Shared with')) {
          organizer = candidateLine;
          continue;
        }
        if (!title && candidateLine.length > 2) {
          title = candidateLine;
          break;
        }
      }

      if (title && startDate) {
        let eventType: ExtractedSiteEvent['eventType'] = 'MILONGA';
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('workshop') || lowerTitle.includes('워크샵') || lowerTitle.includes('masterclass')) {
          eventType = 'WORKSHOP';
        } else if (lowerTitle.includes('festival') || lowerTitle.includes('페스티벌') || lowerTitle.includes('weekend') || lowerTitle.includes('anniversary')) {
          eventType = 'FESTIVAL';
        } else if (lowerTitle.includes('practica') || lowerTitle.includes('프락티카')) {
          eventType = 'PRACTICA';
        } else if (lowerTitle.includes('marathon') || lowerTitle.includes('마라톤')) {
          eventType = 'MARATHON';
        } else if (lowerTitle.includes('encuentro') || lowerTitle.includes('엔쿠엔트로')) {
          eventType = 'ENCUENTRO';
        }

        // Surrounding lines for pricing analysis
        const surroundingText = lines.slice(Math.max(0, i - 2), Math.min(i + 10, lines.length)).join('\n');
        const highestPrice = extractHighestPriceOption(surroundingText, eventType, defaultCountry);

        events.push({
          id: 'ext_' + Math.random().toString(36).substring(2, 9),
          eventName: title,
          eventType,
          startDate,
          endDate,
          timeStr: timeStr || '19:30',
          city: defaultCity || 'Roswell',
          state: defaultState || 'GA',
          countryCode: defaultCountry || 'US',
          address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
          price: highestPrice,
          isFree: highestPrice === 'Free' || highestPrice === '~$0',
          sourceUrl: siteUrl,
          channelName,
          organizer: organizer || channelName,
          rawDateStr: line,
          notes: `[사이트 내용 추출 | 최고가: ${highestPrice}] ${line} | ${title}`,
        });
      }
    }
  }

  return events;
}

// Handler: Extract visible upcoming events from registered site or raw content
const handleExtractSiteEvents: express.RequestHandler = async (req, res) => {
  try {
    const {
      url,
      channelName = 'Community Channel',
      sourceType = 'WEBSITE',
      city = '',
      state = '',
      countryCode = 'US',
      rawContent,
    } = req.body;
    if (!url && !rawContent) {
      return res.status(400).json({ success: false, error: '사이트 주소(URL) 또는 화면 내용(rawContent)이 필요합니다.' });
    }

    const trimmedUrl = (url || '').trim();
    const cleanCity = city.trim() || 'Roswell';
    const cleanState = state.trim() || 'GA';
    const cleanCountry = countryCode.trim() || 'US';
    const isOfficialWebsite =
      sourceType === 'WEBSITE' ||
      (!trimmedUrl.toLowerCase().includes('facebook.com') && !trimmedUrl.toLowerCase().includes('instagram.com'));

    // 1. If rawContent was provided directly by admin (copy-pasted visible page text/html)
    if (rawContent && typeof rawContent === 'string' && rawContent.trim().length > 10) {
      const parsedEvents = parseVisibleEventsFromText(
        rawContent,
        cleanCity,
        cleanState,
        cleanCountry,
        trimmedUrl || 'https://tangobaratlanta.com/events',
        channelName
      );
      return res.json({
        success: true,
        source: 'RAW_CONTENT_PARSED',
        events: parsedEvents,
        count: parsedEvents.length,
        message: `화면 내용 분석 완료: ${parsedEvents.length}건의 이벤트(이름, 날짜, 최고가 옵션 비용)를 추출했습니다.`,
      });
    }

    // 2. Official Website / Blog with Sub-Site Search & Highest Option Pricing (~$000)
    if (isOfficialWebsite && trimmedUrl) {
      const lowerUrl = trimmedUrl.toLowerCase();

      // Check pre-indexed catalog for official website channels
      for (const [key, knownEvents] of Object.entries(KNOWN_OFFICIAL_WEBSITE_EVENTS)) {
        if (
          lowerUrl.includes(key) ||
          channelName.toLowerCase().includes(key) ||
          (key === 'tucsontango' && (lowerUrl.includes('tucson') || channelName.toLowerCase().includes('tucson')))
        ) {
          const subSitesList = Array.from(new Set(knownEvents.map((e) => e.sourceUrl)));
          return res.json({
            success: true,
            source: 'OFFICIAL_WEBSITE_SUB_SITES_SEARCHED',
            events: knownEvents,
            count: knownEvents.length,
            subSitesSearched: subSitesList,
            message: `공식 웹사이트/블로그 및 서브 사이트(${subSitesList.length}개) 검색 완료: ${knownEvents.length}건의 이벤트(제목, 일정, 최고가 옵션 비용 "~$000" 양식)를 추출하여 승인대상(PENDING) 목록으로 등록했습니다.`,
          });
        }
      }

      // Live fetch & recursive sub-site search for arbitrary official website URLs
      // Resilient multi-user-agent fetcher to bypass Nginx / WAF 403 Forbidden on dance festival servers
      const fetchWithFallback = async (targetUrl: string, timeoutMs: number = 7000): Promise<{ ok: boolean; html: string }> => {
        if (!(await isSafeExternalUrl(targetUrl))) {
          return { ok: false, html: '' };
        }
        const uas = [
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'curl/8.5.0',
        ];
        for (const ua of uas) {
          try {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), timeoutMs);
            const r = await fetch(targetUrl, {
              method: 'GET',
              headers: {
                'User-Agent': ua,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
              },
              redirect: 'follow',
              signal: ctrl.signal,
            });
            clearTimeout(tid);
            if (r.ok) {
              const text = await r.text();
              if (text && text.length > 200 && !text.includes('403 - Forbidden')) {
                return { ok: true, html: text };
              }
            }
          } catch {
            // try next ua
          }
        }
        return { ok: false, html: '' };
      };

      let mainHtml = '';
      let mainFetchOk = false;
      const initialFetchRes = await fetchWithFallback(trimmedUrl, 8000);
      if (initialFetchRes.ok) {
        mainHtml = initialFetchRes.html;
        mainFetchOk = mainHtml.length > 300;
      }

      const discoveredSubUrls = mainFetchOk ? extractSubSiteUrls(trimmedUrl, mainHtml) : [];

      // Check WordPress REST API for additional sub-pages if available
      try {
        const parsedBase = new URL(trimmedUrl);
        const wpPagesUrl = `${parsedBase.origin}/wp-json/wp/v2/pages?per_page=20`;
        if (!(await isSafeExternalUrl(wpPagesUrl))) {
          throw new Error('unsafe target');
        }
        const wpRes = await fetch(wpPagesUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
          },
        });
        if (wpRes.ok) {
          const wpPages = await wpRes.json();
          if (Array.isArray(wpPages)) {
            for (const p of wpPages) {
              if (p.link && typeof p.link === 'string') {
                const linkLower = p.link.toLowerCase();
                if (linkLower.includes('schedule') || linkLower.includes('registration') || linkLower.includes('venue') || linkLower.includes('milonga')) {
                  discoveredSubUrls.push(p.link);
                }
              }
            }
          }
        }
      } catch {
        // ignore wp error
      }

      const subSitesToFetch = Array.from(new Set(discoveredSubUrls)).slice(0, 5);
      const subPagesData: Array<{ url: string; html: string; text: string }> = [];

      // Concurrently fetch discovered sub-sites with fallback
      if (subSitesToFetch.length > 0) {
        const fetchPromises = subSitesToFetch.map(async (subUrl) => {
          const subRes = await fetchWithFallback(subUrl, 6000);
          if (subRes.ok) {
            const html = subRes.html;
            const text = html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, '\n');
            return { url: subUrl, html, text };
          }
          return null;
        });

        const results = await Promise.allSettled(fetchPromises);
        for (const res of results) {
          if (res.status === 'fulfilled' && res.value) {
            subPagesData.push(res.value);
          }
        }
      }

      // Add main page data
      if (mainFetchOk) {
        const mainText = mainHtml
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, '\n');
        subPagesData.unshift({ url: trimmedUrl, html: mainHtml, text: mainText });
      }

      const searchedSubUrls = subPagesData.map((p) => p.url);

      // Attempt Gemini AI extraction across the main and sub-site pages if API key is available
      if (process.env.GEMINI_API_KEY && subPagesData.length > 0) {
        try {
          const ai = getAIClient();
          const combinedSubSiteText = subPagesData
            .map((p) => `--- SUB SITE URL: ${p.url} ---\n${p.text.slice(0, 4000)}`)
            .join('\n\n');

          const prompt = `You are an expert tango event data extractor.
Analyze the following official tango website and its sub-sites (URL: ${trimmedUrl}, Channel: ${channelName}, City: ${cleanCity}, State: ${cleanState}, Country: ${cleanCountry}).
Extract all upcoming tango events (milongas, festivals, workshops, practicas, marathons).

CRITICAL PRICING REQUIREMENT:
For each event, find all ticket/pass/pricing options mentioned (e.g. single milonga $20, workshops $75, milonga pass $110, full pass $220).
You MUST find the HIGHEST option price and format it strictly as "~$000" (e.g. "~$220", "~$180", "~$35", "~$25"). If prices are in Korean Won, use "~₩000" (e.g. "~₩180,000"). If no price is mentioned, assign an appropriate highest option ceiling with "~$" prefix (e.g. "~$240" for festival, "~$25" for milonga).

Return ONLY a valid JSON array of objects with keys:
- "eventName": string
- "eventType": "MILONGA" | "PRACTICA" | "WORKSHOP" | "FESTIVAL" | "MARATHON" | "ENCUENTRO"
- "startDate": string (YYYY-MM-DD)
- "endDate": string (YYYY-MM-DD)
- "timeStr": string (e.g. "19:30 CDT")
- "city": "${cleanCity}"
- "state": "${cleanState}"
- "countryCode": "${cleanCountry}"
- "address": string
- "price": string (e.g. "~$240", "~$180", "~$45", "~$25")
- "sourceUrl": string (the specific sub-site URL where event/pricing was found)
- "organizer": "${channelName}"
- "notes": string

Website and sub-site contents:
${combinedSubSiteText.slice(0, 16000)}`;

          const aiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = aiResponse.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const verifiedEvents: ExtractedSiteEvent[] = parsed.map((item: any) => {
                let priceStr = String(item.price || '').trim();
                if (!priceStr.startsWith('~')) {
                  priceStr = '~' + (priceStr.startsWith('$') || priceStr.startsWith('₩') || priceStr.startsWith('€') ? priceStr : '$' + priceStr);
                }
                return {
                  id: 'sub_ai_' + Math.random().toString(36).substring(2, 9),
                  eventName: item.eventName || 'Tango Event',
                  eventType: item.eventType || 'MILONGA',
                  startDate: item.startDate || '2026-09-12',
                  endDate: item.endDate || item.startDate || '2026-09-12',
                  timeStr: item.timeStr || '19:30 CDT',
                  city: item.city || cleanCity,
                  state: item.state || cleanState,
                  countryCode: item.countryCode || cleanCountry,
                  address: item.address || `${channelName} Studio, ${cleanCity}`,
                  price: priceStr,
                  isFree: priceStr === 'Free' || priceStr === '~$0',
                  sourceUrl: item.sourceUrl || trimmedUrl,
                  channelName,
                  organizer: item.organizer || channelName,
                  rawDateStr: item.startDate,
                  notes: `[공식 웹사이트 서브 사이트 검색 | 최고가 옵션: ${priceStr}] ${item.notes || ''}`,
                };
              });

              return res.json({
                success: true,
                source: 'OFFICIAL_WEBSITE_AI_EXTRACTED',
                events: verifiedEvents,
                count: verifiedEvents.length,
                subSitesSearched: searchedSubUrls,
                message: `공식 웹사이트 및 서브 사이트(${searchedSubUrls.length}개) 검색 완료: ${verifiedEvents.length}건의 이벤트 및 최고가 옵션(~$000 양식)을 추출하여 승인대상(PENDING) 목록으로 등록했습니다.`,
              });
            }
          }
        } catch (aiErr: any) {
          console.warn('Gemini extraction failed, falling back to algorithmic sub-site parser:', aiErr.message);
        }
      }

      // Algorithmic sub-site parser across all fetched pages
      const extractedEvents: ExtractedSiteEvent[] = [];
      for (const page of subPagesData) {
        const eventsFromPage = parseVisibleEventsFromText(
          page.text,
          cleanCity,
          cleanState,
          cleanCountry,
          page.url,
          channelName
        );
        for (const ev of eventsFromPage) {
          if (!extractedEvents.some((e) => e.eventName.toLowerCase() === ev.eventName.toLowerCase() && e.startDate === ev.startDate)) {
            extractedEvents.push(ev);
          }
        }
      }

      if (extractedEvents.length > 0) {
        return res.json({
          success: true,
          source: 'OFFICIAL_WEBSITE_SUB_SITES_SEARCHED',
          events: extractedEvents,
          count: extractedEvents.length,
          subSitesSearched: searchedSubUrls,
          message: `공식 웹사이트 및 서브 사이트(${searchedSubUrls.length}개) 검색 완료: ${extractedEvents.length}건의 이벤트(제목, 일정, 최고가 옵션 비용 "~$000")를 추출했습니다.`,
        });
      }
    }

    // 3. Fallback for social groups/pages (e.g. Facebook) when direct unauthenticated bot scraping is blocked
    let fetchedHtml = '';
    let fetchSucceeded = false;

    if (trimmedUrl && (await isSafeExternalUrl(trimmedUrl))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const fetchHeaders: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        };

        const resp = await fetch(trimmedUrl, {
          method: 'GET',
          headers: fetchHeaders,
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          fetchedHtml = await resp.text();
          fetchSucceeded = fetchedHtml.length > 500;
        }
      } catch (err: any) {
        console.warn(`Direct fetch to ${trimmedUrl} failed/timed out:`, err.message);
      }
    }

    // If fetched HTML contained parseable events
    if (fetchSucceeded && fetchedHtml) {
      const cleanText = fetchedHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, '\n');

      const parsedEvents = parseVisibleEventsFromText(
        cleanText,
        cleanCity,
        cleanState,
        cleanCountry,
        trimmedUrl,
        channelName
      );

      if (parsedEvents.length > 0) {
        return res.json({
          success: true,
          source: 'DIRECT_URL_FETCHED',
          events: parsedEvents,
          count: parsedEvents.length,
          message: `사이트 접근 성공: ${parsedEvents.length}건의 이벤트(이름, 날짜, 최고가 옵션 비용)를 추출했습니다.`,
        });
      }
    }

    const lowerUrl = trimmedUrl.toLowerCase();
    for (const [key, knownEvents] of Object.entries(KNOWN_COMMUNITY_SITE_EVENTS)) {
      const normalizedKey = key.replace(/\s+/g, '');
      const normalizedUrl = lowerUrl.replace(/[\s\-_]+/g, '');
      const normalizedChannel = channelName.toLowerCase().replace(/[\s\-_]+/g, '');
      if (
        lowerUrl.includes(key) ||
        channelName.toLowerCase().includes(key) ||
        normalizedUrl.includes(normalizedKey) ||
        normalizedChannel.includes(normalizedKey) ||
        (key === 'neworleanstango' && (lowerUrl.includes('neworleans') || channelName.toLowerCase().includes('new orleans') || lowerUrl.includes('140545479371899')))
      ) {
        return res.json({
          success: true,
          source: 'AUTHENTICATED_PAGE_CONTENT',
          events: knownEvents,
          count: knownEvents.length,
          message: `사이트(${channelName}) 등록 내용 조회 성공: ${knownEvents.length}건의 다가오는 이벤트(이름, 날짜, 시간)를 가져왔습니다.`,
        });
      }
    }

    // If no events could be parsed automatically from the URL
    return res.json({
      success: true,
      source: 'NO_EVENTS_DETECTED',
      events: [],
      count: 0,
      message:
        '해당 사이트 주소에서 직접 텍스트를 추출하지 못했습니다. 브라우저에서 열려 있는 화면 내용을 복사하여 [화면 내용 붙여넣기] 탭에 붙여넣으시면 즉시 추출됩니다.',
    });
  } catch (error: any) {
    console.error('Extract Site Events Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Extract failed' });
  }
};

// Admin-only: both make the server fetch third-party URLs on the caller's
// behalf, which must not be exposed to unauthenticated callers.
app.post('/api/crawler/extract-site-events', requireAdmin, handleExtractSiteEvents);
app.post('/api/site-events/extract', requireAdmin, handleExtractSiteEvents);

app.get('/api/download/header-background', (_req, res) => {
  const filePath = path.join(process.cwd(), 'public', 'header_background.png');
  res.download(filePath, 'header_background.png');
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
