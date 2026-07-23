// ============================================================================
// Request modal: open/close, client-side validation, secure submission.
// Client validation is UX only — the server (server/validate.js) is the gate.
// ============================================================================

let modal, dialog, form, alertBox, successBox, submitBtn, lastFocused;
let isSubmitting = false;

export function initForm() {
  modal = document.getElementById('request-modal');
  if (!modal) return;
  dialog = modal.querySelector('.modal__dialog');
  form = modal.querySelector('#request-form');
  alertBox = modal.querySelector('#form-alert');
  successBox = modal.querySelector('#form-success');
  submitBtn = modal.querySelector('#form-submit');

  // Open triggers: any element with .js-request (buttons, CTA links)
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.js-request');
    if (trigger) {
      e.preventDefault();
      openModal({
        vehicle: trigger.dataset.vehicle || '',
        country: trigger.dataset.country || '',
      });
    }
  });

  // Close triggers
  modal.querySelectorAll('[data-close]').forEach((el) =>
    el.addEventListener('click', closeModal)
  );
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  form.addEventListener('submit', onSubmit);

  // Clear per-field error as the user corrects it
  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field) field.classList.remove('field--invalid');
  });
}

export function openModal(prefill = {}) {
  if (!modal) return;
  lastFocused = document.activeElement;
  resetForm();

  // Prefill from a specific car card when available.
  // Use form.elements throughout to avoid reserved-property gotchas.
  const els = form.elements;
  if (prefill.vehicle) {
    const parts = prefill.vehicle.split(' ');
    els.brand.value = parts.shift() || '';
    els.model.value = parts.join(' ');
  }
  if (prefill.country && els.country.querySelector(`option[value="${prefill.country}"]`)) {
    els.country.value = prefill.country;
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Focus first field after the open transition.
  // NB: use form.elements.name — `form.name` is the form's own name attribute.
  setTimeout(() => form.elements.name?.focus(), 180);
  trapFocus();
}

export function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  releaseFocus();
  lastFocused?.focus?.();
}

function resetForm() {
  form.hidden = false;
  form.reset();
  alertBox.classList.remove('is-visible');
  alertBox.textContent = '';
  successBox.classList.remove('is-visible');
  form.querySelectorAll('.field--invalid').forEach((f) => f.classList.remove('field--invalid'));
  setLoading(false);
}

// --- Validation ---------------------------------------------------------------

function markInvalid(name, message) {
  const input = form.elements[name];
  const field = input?.closest('.field');
  if (field) {
    field.classList.add('field--invalid');
    const err = field.querySelector('.field__error');
    if (err && message) err.textContent = message;
  }
}

function looksLikePhone(v) {
  const d = v.replace(/\D/g, '');
  return d.length >= 7 && d.length <= 15;
}

function validate() {
  let firstInvalid = null;
  const fail = (name, msg) => { markInvalid(name, msg); if (!firstInvalid) firstInvalid = name; };

  const els = form.elements;
  const name = els.name.value.trim();
  const phone = els.phone.value.trim();
  const telegram = els.telegram.value.trim();
  const whatsapp = els.whatsapp.value.trim();
  const instagram = els.instagram.value.trim();

  if (name.length < 2) fail('name', 'Укажите имя.');

  const hasContact =
    (phone && looksLikePhone(phone)) || telegram.length >= 2 ||
    (whatsapp && looksLikePhone(whatsapp)) || instagram.length >= 2;
  if (!hasContact) {
    fail('phone', 'Укажите хотя бы один способ связи.');
    showAlert('Оставьте телефон, Telegram, WhatsApp или Instagram — чтобы мы могли ответить.');
  } else if (phone && !looksLikePhone(phone)) {
    fail('phone', 'Проверьте номер телефона.');
  }

  return firstInvalid;
}

// --- Submit -------------------------------------------------------------------

async function onSubmit(e) {
  e.preventDefault();
  if (isSubmitting) return;
  hideAlert();

  const firstInvalid = validate();
  if (firstInvalid) {
    form.elements[firstInvalid]?.focus();
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());

  setLoading(true);
  isSubmitting = true;
  try {
    const res = await fetch('/api/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.ok) {
      showSuccess();
    } else if (res.status === 429) {
      showAlert(json.error || 'Слишком много заявок. Попробуйте немного позже.');
    } else if (json.errors?.length) {
      showAlert(json.errors[0]);
    } else {
      showAlert('Не удалось отправить заявку. Попробуйте ещё раз или напишите нам напрямую.');
    }
  } catch (err) {
    showAlert('Проблема с соединением. Проверьте интернет и попробуйте снова.');
  } finally {
    setLoading(false);
    // small delay before re-enabling to further discourage rapid double-submits
    setTimeout(() => { isSubmitting = false; }, 1500);
  }
}

function setLoading(on) {
  if (!submitBtn) return;
  submitBtn.classList.toggle('is-loading', on);
  submitBtn.disabled = on;
}

function showAlert(msg) {
  alertBox.textContent = msg;
  alertBox.classList.add('is-visible');
}
function hideAlert() {
  alertBox.classList.remove('is-visible');
  alertBox.textContent = '';
}

function showSuccess() {
  form.hidden = true;
  document.getElementById('form-foot')?.setAttribute('hidden', '');
  successBox.classList.add('is-visible');
}

// --- Focus trap ---------------------------------------------------------------

let trapHandler = null;
function trapFocus() {
  const focusable = () =>
    modal.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
  trapHandler = (e) => {
    if (e.key !== 'Tab') return;
    const items = Array.from(focusable()).filter((el) => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener('keydown', trapHandler);
}
function releaseFocus() {
  if (trapHandler) document.removeEventListener('keydown', trapHandler);
  trapHandler = null;
}
