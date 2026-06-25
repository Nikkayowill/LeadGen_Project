alter table public.leads
  add column if not exists contactability_score integer not null default 0 check (contactability_score between 0 and 100),
  add column if not exists website_gap text not null default 'unverified',
  add column if not exists discovery_fit text not null default 'research';

alter table public.leads
  drop constraint if exists leads_website_gap_check;

alter table public.leads
  add constraint leads_website_gap_check
  check (website_gap in ('provider_no_website', 'not_listed', 'weak_website', 'unverified', 'healthy_website', 'booking_present'));

alter table public.leads
  drop constraint if exists leads_discovery_fit_check;

alter table public.leads
  add constraint leads_discovery_fit_check
  check (discovery_fit in ('call_now', 'review_first', 'research', 'skip'));

alter table public.discovered_leads
  add column if not exists contactability_score integer not null default 0 check (contactability_score between 0 and 100),
  add column if not exists website_gap text not null default 'unverified',
  add column if not exists discovery_fit text not null default 'research';

alter table public.discovered_leads
  drop constraint if exists discovered_leads_website_gap_check;

alter table public.discovered_leads
  add constraint discovered_leads_website_gap_check
  check (website_gap in ('provider_no_website', 'not_listed', 'weak_website', 'unverified', 'healthy_website', 'booking_present'));

alter table public.discovered_leads
  drop constraint if exists discovered_leads_discovery_fit_check;

alter table public.discovered_leads
  add constraint discovered_leads_discovery_fit_check
  check (discovery_fit in ('call_now', 'review_first', 'research', 'skip'));

create table if not exists public.api_usage_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  provider text not null check (provider in ('google_places', 'yelp')),
  feature text not null default 'lead_finder',
  units integer not null default 1 check (units > 0),
  query text null,
  location text null,
  result_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_discovery_fit_idx on public.leads(discovery_fit);
create index if not exists leads_website_gap_idx on public.leads(website_gap);
create index if not exists leads_contactability_score_idx on public.leads(contactability_score desc);
create index if not exists discovered_leads_fit_score_idx on public.discovered_leads(discovery_run_id, discovery_fit, lead_score desc);
create index if not exists discovered_leads_website_gap_idx on public.discovered_leads(website_gap);
create index if not exists discovered_leads_contactability_score_idx on public.discovered_leads(contactability_score desc);
create index if not exists api_usage_events_provider_created_at_idx on public.api_usage_events(provider, created_at desc);

grant select, insert, update, delete on table public.api_usage_events to anon, authenticated;

alter table public.api_usage_events enable row level security;

drop policy if exists "mvp anon select api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon insert api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon update api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon delete api_usage_events" on public.api_usage_events;
create policy "mvp anon select api_usage_events" on public.api_usage_events for select to anon, authenticated using (true);
create policy "mvp anon insert api_usage_events" on public.api_usage_events for insert to anon, authenticated with check (true);
create policy "mvp anon update api_usage_events" on public.api_usage_events for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete api_usage_events" on public.api_usage_events for delete to anon, authenticated using (true);

notify pgrst, 'reload schema';
