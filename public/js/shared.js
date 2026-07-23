// ============================================================================
// Shared helpers used by both the landing page and the /cars catalog.
// ============================================================================

import { COUNTRY_LABELS, TYPE_LABELS } from './data/vehicles.js';

/** Escape user/dynamic text before inserting as HTML. Guards against XSS. */
export function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a RUB amount, e.g. 9800000 → "9 800 000 ₽". */
export function formatPrice(rub) {
  if (!rub && rub !== 0) return '—';
  return new Intl.NumberFormat('ru-RU').format(rub) + ' ₽';
}

/** Format km, e.g. 0 → "новый", 18000 → "18 000 км". */
export function formatMileage(km) {
  if (!km) return 'новый';
  return new Intl.NumberFormat('ru-RU').format(km) + ' км';
}

/**
 * Generate an elegant inline-SVG placeholder for a vehicle card.
 * Monochrome, brand-aware — replaced automatically if a real `image` is set.
 */
export function placeholderSvg(v) {
  const label = esc(`${v.brand}`).toUpperCase();
  const sub = esc(v.model);
  return `
  <svg viewBox="0 0 320 200" role="img" aria-label="${esc(v.brand)} ${esc(v.model)}" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="g-${v.id}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#212429"/>
        <stop offset="1" stop-color="#0b0c0e"/>
      </linearGradient>
    </defs>
    <rect width="320" height="200" fill="url(#g-${v.id})"/>
    <g stroke="rgba(255,255,255,0.10)" stroke-width="1">
      <line x1="0" y1="150" x2="320" y2="150"/>
      <line x1="0" y1="120" x2="320" y2="120"/>
    </g>
    <path d="M60 138 q6 -30 34 -34 l40 -5 q22 -18 52 -18 q34 0 50 22 l30 4 q16 3 18 20 l0 8 q0 4 -6 4 l-14 0 a14 14 0 0 0 -28 0 l-86 0 a14 14 0 0 0 -28 0 l-14 0 q-8 0 -8 -8 l0 -6 q0 -8 8 -11 z"
      fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.22)" stroke-width="1.4"/>
    <circle cx="118" cy="150" r="12" fill="#0b0c0e" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <circle cx="218" cy="150" r="12" fill="#0b0c0e" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <text x="20" y="34" fill="rgba(255,255,255,0.85)" font-family="Inter, sans-serif" font-size="16" font-weight="700" letter-spacing="1">${label}</text>
    <text x="20" y="54" fill="rgba(255,255,255,0.45)" font-family="Inter, sans-serif" font-size="12">${sub}</text>
  </svg>`;
}

/** Build the HTML for a single vehicle card. */
export function carCard(v) {
  const media = v.image
    ? `<img src="${esc(v.image)}" alt="${esc(v.brand)} ${esc(v.model)}" loading="lazy" width="320" height="200">`
    : placeholderSvg(v);

  const badge = v.badge ? `<span class="car__badge">${esc(v.badge)}</span>` : '';
  const country = COUNTRY_LABELS[v.country] || '';
  const typeLabel = TYPE_LABELS[v.type] || '';

  return `
  <article class="car reveal" data-country="${esc(v.country)}" data-type="${esc(v.type)}">
    <div class="car__media">
      ${media}
      ${badge}
      <span class="car__country">${esc(country)}</span>
    </div>
    <div class="car__body">
      <h3 class="car__title">${esc(v.brand)} ${esc(v.model)}</h3>
      <div class="car__spec">
        <span>${esc(v.year)}</span>
        <span>${esc(v.engine)}</span>
        <span>${formatMileage(v.mileage)}</span>
        <span>${esc(typeLabel)}</span>
      </div>
      <div class="car__foot">
        <div class="car__price">
          <b>${formatPrice(v.price)}</b>
          <span>примерно в РФ</span>
        </div>
        <button class="btn js-request" data-vehicle="${esc(v.brand)} ${esc(v.model)}" data-country="${esc(v.country)}">Получить расчёт</button>
      </div>
    </div>
  </article>`;
}

/** IntersectionObserver-based scroll reveal (respects reduced motion). */
export function initReveal(root = document) {
  const els = root.querySelectorAll('.reveal:not(.is-in)');
  if (!('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
}
