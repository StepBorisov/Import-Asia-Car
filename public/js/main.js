// ============================================================================
// ZAVOZ — landing page entry point.
// ============================================================================

import { VEHICLES } from './data/vehicles.js';
import { carCard, initReveal } from './shared.js';
import { initForm } from './form.js';

// --- Header: solid background + text color swap on scroll ---
const header = document.getElementById('header');
function onScroll() {
  if (window.scrollY > 40) header.classList.add('is-scrolled');
  else header.classList.remove('is-scrolled');
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// --- Mobile menu ---
const burger = document.getElementById('burger');
const mobileMenu = document.getElementById('mobile-menu');
function toggleMenu(open) {
  const isOpen = open ?? !mobileMenu.classList.contains('is-open');
  mobileMenu.classList.toggle('is-open', isOpen);
  burger.classList.toggle('is-open', isOpen);
  burger.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
}
burger?.addEventListener('click', () => toggleMenu());
mobileMenu?.querySelectorAll('a').forEach((a) =>
  a.addEventListener('click', () => toggleMenu(false))
);

// --- Render catalog preview (first 6 vehicles) ---
const preview = document.getElementById('catalog-preview');
if (preview) {
  preview.innerHTML = VEHICLES.slice(0, 6).map(carCard).join('');
}

// --- Init form modal + scroll reveal ---
initForm();
initReveal();

// --- Smooth-scroll for same-page anchors (offset for fixed header) ---
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute('href');
  if (id === '#' || id.length < 2) return;
  const target = document.querySelector(id);
  if (!target) return;
  e.preventDefault();
  const y = target.getBoundingClientRect().top + window.scrollY - 70;
  window.scrollTo({ top: y, behavior: 'smooth' });
});

// --- Footer year ---
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
