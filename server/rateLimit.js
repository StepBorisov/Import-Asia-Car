// ============================================================================
// Minimal in-memory rate limiter (no external dependency).
// Good enough for a single Render instance. For multi-instance scaling,
// swap the Map for a shared store (Redis/Upstash) with the same interface.
// ============================================================================

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 10 * 60 * 1000;
const MAX_HITS = Number(process.env.RATE_LIMIT_MAX) || 5;

const hits = new Map(); // ip -> { count, resetAt }

// Periodically drop expired buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of hits) {
    if (rec.resetAt <= now) hits.delete(ip);
  }
}, WINDOW_MS).unref?.();

/**
 * Express middleware. Rejects with 429 once an IP exceeds MAX_HITS per window.
 */
export function rateLimit(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  let rec = hits.get(ip);

  if (!rec || rec.resetAt <= now) {
    rec = { count: 0, resetAt: now + WINDOW_MS };
    hits.set(ip, rec);
  }

  rec.count += 1;

  if (rec.count > MAX_HITS) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({
      ok: false,
      error: 'Слишком много заявок. Пожалуйста, попробуйте позже.',
    });
  }

  next();
}

function getClientIp(req) {
  // Render/most proxies set x-forwarded-for; take the first hop.
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) {
    return fwd.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
