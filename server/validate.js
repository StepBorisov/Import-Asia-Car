// ============================================================================
// Server-side validation & sanitization for incoming lead requests.
// Frontend validation is a UX nicety only — this is the real gate.
// ============================================================================

const COUNTRIES = ['china', 'korea', 'japan', 'unsure'];
const VEHICLE_TYPES = [
  'sedan', 'crossover', 'suv', 'minivan', 'sports',
  'motorcycle', 'special', 'other', '',
];
const CONTACT_METHODS = ['telegram', 'whatsapp', 'phone', 'instagram', 'any', ''];

const MAX = {
  name: 120,
  phone: 40,
  telegram: 80,
  whatsapp: 40,
  instagram: 80,
  brand: 80,
  model: 120,
  additional: 2000,
  numeric: 15, // digits for year/budget/mileage
};

// Control characters (C0 range + DEL) that should never survive into storage.
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/**
 * Collapse whitespace, strip control chars, and hard-trim to a max length.
 * We store the raw (but bounded) text; escaping for HTML happens at render time
 * and inside the Telegram formatter — never trust "sanitized once, safe forever".
 */
function clean(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value
    .replace(CONTROL_CHARS, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

/** Keep only digits, bounded — used for numeric range fields. */
function cleanNumber(value) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[^\d]/g, '').slice(0, MAX.numeric);
}

/** A phone that still has enough digits to be plausibly real. */
function looksLikePhone(value) {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Validate & normalize a submission.
 * Returns { ok: true, data } or { ok: false, errors: [...] }.
 */
export function validateRequest(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Некорректный формат запроса.'] };
  }

  // --- Honeypot: bots fill hidden fields. If present, silently reject. ---
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return { ok: false, errors: ['spam'], spam: true };
  }

  const data = {
    name: clean(body.name, MAX.name),
    phone: clean(body.phone, MAX.phone),
    telegram: clean(body.telegram, MAX.telegram),
    whatsapp: clean(body.whatsapp, MAX.whatsapp),
    instagram: clean(body.instagram, MAX.instagram),
    preferred_contact_method: clean(body.preferred_contact_method, 20).toLowerCase(),
    country: clean(body.country, 20).toLowerCase(),
    brand: clean(body.brand, MAX.brand),
    model: clean(body.model, MAX.model),
    year_from: cleanNumber(body.year_from),
    year_to: cleanNumber(body.year_to),
    budget_from: cleanNumber(body.budget_from),
    budget_to: cleanNumber(body.budget_to),
    mileage_from: cleanNumber(body.mileage_from),
    mileage_to: cleanNumber(body.mileage_to),
    vehicle_type: clean(body.vehicle_type, 20).toLowerCase(),
    additional_requirements: clean(body.additional_requirements, MAX.additional),
    source: 'Сайт ZAVOZ',
    status: 'new',
  };

  // --- Required: a name ---
  if (data.name.length < 2) {
    errors.push('Укажите имя.');
  }

  // --- Required: at least one usable contact method ---
  const hasPhone = data.phone && looksLikePhone(data.phone);
  const hasTelegram = data.telegram.length >= 2;
  const hasWhatsapp = data.whatsapp && looksLikePhone(data.whatsapp);
  const hasInstagram = data.instagram.length >= 2;
  if (!hasPhone && !hasTelegram && !hasWhatsapp && !hasInstagram) {
    errors.push('Укажите хотя бы один способ связи (телефон, Telegram, WhatsApp или Instagram).');
  }
  if (data.phone && !looksLikePhone(data.phone)) {
    errors.push('Проверьте номер телефона.');
  }

  // --- Enumerated fields: reject unknown values ---
  if (data.country && !COUNTRIES.includes(data.country)) {
    errors.push('Некорректная страна.');
  }
  if (data.vehicle_type && !VEHICLE_TYPES.includes(data.vehicle_type)) {
    errors.push('Некорректный тип автомобиля.');
  }
  if (data.preferred_contact_method && !CONTACT_METHODS.includes(data.preferred_contact_method)) {
    // Not fatal — normalize unknown to empty rather than reject the lead.
    data.preferred_contact_method = '';
  }

  // --- Range sanity: swap reversed ranges instead of rejecting ---
  fixRange(data, 'year_from', 'year_to');
  fixRange(data, 'budget_from', 'budget_to');
  fixRange(data, 'mileage_from', 'mileage_to');

  if (errors.length) return { ok: false, errors };
  return { ok: true, data };
}

function fixRange(data, fromKey, toKey) {
  const from = data[fromKey];
  const to = data[toKey];
  if (from && to && Number(from) > Number(to)) {
    data[fromKey] = to;
    data[toKey] = from;
  }
}
