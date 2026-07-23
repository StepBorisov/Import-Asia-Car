// ============================================================================
// ZAVOZ — /cars catalog page: search + filtering.
// ============================================================================

import { VEHICLES } from './data/vehicles.js';
import { carCard, initReveal } from './shared.js';
import { initForm } from './form.js';

const listEl = document.getElementById('catalog-list');
const metaEl = document.getElementById('catalog-meta');
const emptyEl = document.getElementById('catalog-empty');

const controls = {
  search: document.getElementById('f-search'),
  brand: document.getElementById('f-brand'),
  country: document.getElementById('f-country'),
  type: document.getElementById('f-type'),
  priceMin: document.getElementById('f-price-min'),
  priceMax: document.getElementById('f-price-max'),
  yearMin: document.getElementById('f-year-min'),
  yearMax: document.getElementById('f-year-max'),
  reset: document.getElementById('f-reset'),
};

// Populate brand <select> dynamically from data.
const brands = [...new Set(VEHICLES.map((v) => v.brand))].sort();
for (const b of brands) {
  const opt = document.createElement('option');
  opt.value = b; opt.textContent = b;
  controls.brand.appendChild(opt);
}

function num(v) { const n = parseInt(String(v).replace(/\D/g, ''), 10); return Number.isFinite(n) ? n : null; }

function apply() {
  const q = (controls.search.value || '').trim().toLowerCase();
  const brand = controls.brand.value;
  const country = controls.country.value;
  const type = controls.type.value;
  const priceMin = num(controls.priceMin.value);
  const priceMax = num(controls.priceMax.value);
  const yearMin = num(controls.yearMin.value);
  const yearMax = num(controls.yearMax.value);

  const filtered = VEHICLES.filter((v) => {
    if (q) {
      const hay = `${v.brand} ${v.model} ${v.engine}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (brand && v.brand !== brand) return false;
    if (country && v.country !== country) return false;
    if (type && v.type !== type) return false;
    if (priceMin !== null && v.price < priceMin) return false;
    if (priceMax !== null && v.price > priceMax) return false;
    if (yearMin !== null && v.year < yearMin) return false;
    if (yearMax !== null && v.year > yearMax) return false;
    return true;
  });

  render(filtered);
}

function render(items) {
  if (!items.length) {
    listEl.innerHTML = '';
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
    listEl.innerHTML = items.map(carCard).join('');
    initReveal(listEl);
  }
  const n = items.length;
  metaEl.textContent = `Найдено: ${n} ${plural(n, ['автомобиль', 'автомобиля', 'автомобилей'])}`;
}

function plural(n, forms) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1];
  return forms[2];
}

// Debounce text search a touch for smoothness.
let t;
function debouncedApply() { clearTimeout(t); t = setTimeout(apply, 120); }

Object.entries(controls).forEach(([key, el]) => {
  if (!el || key === 'reset') return;
  const evt = el.tagName === 'SELECT' ? 'change' : 'input';
  el.addEventListener(evt, key === 'search' ? debouncedApply : apply);
});

controls.reset?.addEventListener('click', () => {
  ['search', 'priceMin', 'priceMax', 'yearMin', 'yearMax'].forEach((k) => (controls[k].value = ''));
  ['brand', 'country', 'type'].forEach((k) => (controls[k].value = ''));
  apply();
});

initForm();
apply();

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
