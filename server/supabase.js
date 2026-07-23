// ============================================================================
// Supabase storage. The SERVICE ROLE key is used ONLY here, server-side.
// It bypasses Row Level Security by design — it must never reach the browser.
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let client = null;
if (SUPABASE_URL && SERVICE_KEY) {
  client = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
} else {
  console.warn('[supabase] Not configured (missing SUPABASE_URL/SERVICE_ROLE_KEY) — storage disabled.');
}

export function isConfigured() {
  return client !== null;
}

/**
 * Insert a validated lead into the "requests" table.
 * Returns { ok, id?, skipped?, error? }.
 */
export async function saveRequest(data) {
  if (!client) return { ok: false, skipped: true };

  const { data: row, error } = await client
    .from('requests')
    .insert({
      name: data.name,
      phone: data.phone || null,
      telegram: data.telegram || null,
      whatsapp: data.whatsapp || null,
      instagram: data.instagram || null,
      preferred_contact_method: data.preferred_contact_method || null,
      country: data.country || null,
      brand: data.brand || null,
      model: data.model || null,
      year_from: data.year_from ? Number(data.year_from) : null,
      year_to: data.year_to ? Number(data.year_to) : null,
      budget_from: data.budget_from ? Number(data.budget_from) : null,
      budget_to: data.budget_to ? Number(data.budget_to) : null,
      mileage_from: data.mileage_from ? Number(data.mileage_from) : null,
      mileage_to: data.mileage_to ? Number(data.mileage_to) : null,
      vehicle_type: data.vehicle_type || null,
      additional_requirements: data.additional_requirements || null,
      source: data.source,
      status: data.status,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[supabase] Insert failed:', error.message);
    return { ok: false, error: 'db_insert_failed' };
  }
  return { ok: true, id: row.id };
}
