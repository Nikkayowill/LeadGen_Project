alter table public.leads
  add column if not exists source text null,
  add column if not exists source_place_id text null,
  add column if not exists has_website boolean not null default false,
  add column if not exists has_booking_system boolean not null default false,
  add column if not exists booking_system text null,
  add column if not exists lead_score integer not null default 0,
  add column if not exists discovery_metadata jsonb not null default '{}'::jsonb;

create index if not exists leads_source_place_idx on public.leads(source, source_place_id);
create index if not exists leads_has_website_idx on public.leads(has_website);
create index if not exists leads_has_booking_system_idx on public.leads(has_booking_system);
create index if not exists leads_lead_score_idx on public.leads(lead_score desc);
