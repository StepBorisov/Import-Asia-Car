// ============================================================================
// ZAVOZ — Express server.
// Serves the static frontend and exposes a single secure lead endpoint.
// ============================================================================

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { validateRequest } from './validate.js';
import { rateLimit } from './rateLimit.js';
import { sendTelegram } from './telegram.js';
import { saveRequest, isConfigured as dbConfigured } from './supabase.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1); // behind Render's proxy

// --- Security headers (no external dependency needed) ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// --- CORS: same-origin by default; opt-in extra origins via env ---
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Body parser with a strict size cap to blunt payload-based abuse.
app.use(express.json({ limit: '32kb' }));

// --- Short-term duplicate suppression (idempotency) ---
// Prevents accidental double-submits (double-click, retry) from the same
// person within a small window. Not a security control on its own.
const recentHashes = new Map(); // hash -> timestamp
const DUPLICATE_WINDOW_MS = 60 * 1000;
function isDuplicate(data) {
  const key = crypto
    .createHash('sha256')
    .update([data.name, data.phone, data.telegram, data.brand, data.model, data.additional_requirements].join('|'))
    .digest('hex');
  const now = Date.now();
  for (const [h, t] of recentHashes) {
    if (now - t > DUPLICATE_WINDOW_MS) recentHashes.delete(h);
  }
  if (recentHashes.has(key)) return true;
  recentHashes.set(key, now);
  return false;
}

// --- Health check ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: dbConfigured(), time: new Date().toISOString() });
});

// --- Lead submission ---
app.post('/api/request', rateLimit, async (req, res) => {
  const result = validateRequest(req.body);

  if (!result.ok) {
    // Honeypot / bot: pretend success so bots don't learn anything.
    if (result.spam) return res.json({ ok: true });
    return res.status(400).json({ ok: false, errors: result.errors });
  }

  const { data } = result;

  if (isDuplicate(data)) {
    // Treat as success — the first submission already went through.
    return res.json({ ok: true, duplicate: true });
  }

  // Store first (source of truth), then notify. Neither failure loses the lead
  // silently: we log, and return success if at least one channel worked.
  const [dbRes, tgRes] = await Promise.all([
    saveRequest(data).catch((e) => ({ ok: false, error: e.message })),
    sendTelegram(data).catch((e) => ({ ok: false, error: e.message })),
  ]);

  const stored = dbRes.ok || dbRes.skipped;
  const notified = tgRes.ok || tgRes.skipped;

  if (!dbRes.ok && !tgRes.ok) {
    // Both real channels failed — tell the client to try another way.
    console.error('[request] Both DB and Telegram failed', { dbRes, tgRes });
    return res.status(502).json({
      ok: false,
      errors: ['Не удалось отправить заявку. Пожалуйста, свяжитесь с нами напрямую.'],
    });
  }

  return res.json({ ok: true, stored, notified });
});

// --- Static frontend ---
app.use(
  express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (/\.(css|js|svg|png|jpg|jpeg|webp|woff2?)$/.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  })
);

// Clean URL for the catalog.
app.get('/cars', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'cars.html'));
});

// 404 fallback.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ZAVOZ server running on port ${PORT} (${IS_PROD ? 'production' : 'development'})`);
  if (!dbConfigured()) console.log('  ⚠ Supabase not configured — leads will not be stored.');
  if (!process.env.TELEGRAM_BOT_TOKEN) console.log('  ⚠ Telegram not configured — managers will not be notified.');
});
