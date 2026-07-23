// ============================================================================
// Telegram notification. Token & chat id live ONLY in env vars, server-side.
// Uses the global fetch available in Node 18+ (no dependency).
// ============================================================================

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const COUNTRY_LABELS = {
  china: 'Китай',
  korea: 'Южная Корея',
  japan: 'Япония',
  unsure: 'Не определился — нужна помощь',
};

const TYPE_LABELS = {
  sedan: 'Седан',
  crossover: 'Кроссовер',
  suv: 'Внедорожник',
  minivan: 'Минивэн',
  sports: 'Спорткар',
  motorcycle: 'Мотоцикл',
  special: 'Спецтехника',
  other: 'Другое',
};

const CONTACT_LABELS = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  phone: 'Телефон',
  instagram: 'Instagram',
  any: 'Любой',
};

// HTML-escape for Telegram parse_mode=HTML. Prevents injection into the message.
function esc(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function line(label, value) {
  if (!value) return '';
  return `<b>${label}:</b>\n${esc(value)}\n\n`;
}

function range(from, to, suffix = '') {
  if (!from && !to) return '';
  if (from && to) return `${esc(from)} – ${esc(to)}${suffix}`;
  if (from) return `от ${esc(from)}${suffix}`;
  return `до ${esc(to)}${suffix}`;
}

export function buildMessage(d) {
  let msg = '🚗 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n';
  msg += line('Имя', d.name);
  msg += line('Телефон', d.phone);
  msg += line('Telegram', d.telegram);
  msg += line('WhatsApp', d.whatsapp);
  msg += line('Instagram', d.instagram);
  msg += line('Предпочтительный способ связи', CONTACT_LABELS[d.preferred_contact_method]);

  msg += '— — — — —\n<b>АВТОМОБИЛЬ</b>\n\n';
  msg += line('Страна', COUNTRY_LABELS[d.country]);
  msg += line('Марка', d.brand);
  msg += line('Модель', d.model);
  msg += line('Год', range(d.year_from, d.year_to));
  msg += line('Бюджет', range(d.budget_from, d.budget_to, ' ₽'));
  msg += line('Пробег', range(d.mileage_from, d.mileage_to, ' км'));
  msg += line('Тип', TYPE_LABELS[d.vehicle_type]);
  msg += line('Дополнительные пожелания', d.additional_requirements);

  msg += `— — — — —\n<b>Источник:</b> ${esc(d.source)}`;
  return msg;
}

/**
 * Send the lead to the managers' Telegram chat.
 * Returns { ok: boolean, skipped?: boolean, error?: string }.
 * A Telegram failure must NOT lose the lead — the caller still stores it in DB.
 */
export async function sendTelegram(data) {
  if (!TOKEN || !CHAT_ID) {
    console.warn('[telegram] Not configured (missing TELEGRAM_BOT_TOKEN/CHAT_ID) — skipping.');
    return { ok: false, skipped: true };
  }

  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: buildMessage(data),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const body = await res.text();
      console.error('[telegram] API error:', res.status, body);
      return { ok: false, error: `telegram_${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error('[telegram] Request failed:', err.message);
    return { ok: false, error: 'telegram_request_failed' };
  }
}
