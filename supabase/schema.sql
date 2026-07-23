-- ============================================================================
-- ZAVOZ — Supabase schema for lead requests.
-- Run this in the Supabase SQL editor (Project → SQL Editor → New query).
-- ============================================================================

-- Enum for the lead lifecycle (ready for future CRM use).
do $$
begin
  if not exists (select 1 from pg_type where typname = 'request_status') then
    create type request_status as enum (
      'new', 'in_progress', 'assigned', 'completed', 'rejected'
    );
  end if;
end$$;

create table if not exists public.requests (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),

  -- Contact
  name                     text not null,
  phone                    text,
  telegram                 text,
  whatsapp                 text,
  instagram                text,
  preferred_contact_method text,

  -- Vehicle requirements
  country                  text,
  brand                    text,
  model                    text,
  year_from                integer,
  year_to                  integer,
  budget_from              bigint,
  budget_to                bigint,
  mileage_from             integer,
  mileage_to               integer,
  vehicle_type             text,
  additional_requirements  text,

  -- Meta
  source                   text default 'Сайт ZAVOZ',
  status                   request_status not null default 'new'
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_status_idx      on public.requests (status);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Enable RLS and add NO permissive policies for anon/authenticated roles.
-- Result: the public anon key cannot read or write this table at all.
-- The server uses the SERVICE ROLE key, which bypasses RLS by design, so the
-- backend keeps working while the browser is fully locked out.
alter table public.requests enable row level security;
alter table public.requests force row level security;

-- (Intentionally no CREATE POLICY statements: default-deny for all client roles.)

-- If you later build an admin CRM with Supabase Auth, add a scoped policy like:
--   create policy "admins read" on public.requests
--     for select to authenticated
--     using (auth.jwt() ->> 'role' = 'admin');
