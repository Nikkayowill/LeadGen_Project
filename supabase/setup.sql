-- SiteScout setup bundle.
-- Run this in the Supabase SQL Editor for the project in .env.local.
-- It combines the local migrations in order.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  business_name text not null,
  contact_name text null,
  phone text null,
  email text null,
  facebook_url text null,
  instagram_url text null,
  website_url text null,
  industry text null,
  location text null,
  website_status text not null default 'Unknown'
    check (website_status in ('No Website', 'Outdated Website', 'Good Website', 'Unknown')),
  lead_status text not null default 'Not Contacted'
    check (lead_status in ('Not Contacted', 'Called', 'Messaged', 'Follow-Up', 'Demo Booked', 'Won', 'Lost')),
  quoted_price numeric(10, 2) null default 500,
  monthly_fee numeric(10, 2) null default 20,
  notes text null,
  next_follow_up date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  type text not null,
  summary text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.pitch_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  industry text null,
  template_name text not null,
  message_body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  account_id uuid null,
  one_time_price numeric(10, 2) not null default 500,
  monthly_price numeric(10, 2) not null default 20,
  status text not null default 'Open' check (status in ('Open', 'Won', 'Lost')),
  close_date date null,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_templates (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  template_name text not null,
  one_time_price numeric(10, 2) not null default 500,
  monthly_price numeric(10, 2) not null default 20,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

alter table public.leads
  add column if not exists source text null,
  add column if not exists source_place_id text null,
  add column if not exists has_website boolean not null default false,
  add column if not exists has_booking_system boolean not null default false,
  add column if not exists booking_system text null,
  add column if not exists contactability_score integer not null default 0 check (contactability_score between 0 and 100),
  add column if not exists website_gap text not null default 'unverified',
  add column if not exists discovery_fit text not null default 'research',
  add column if not exists lead_score integer not null default 0,
  add column if not exists discovery_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  query text not null,
  location text not null,
  radius_miles integer not null default 10 check (radius_miles between 1 and 100),
  max_results integer not null default 10 check (max_results between 1 and 100),
  provider text not null default 'auto',
  search_depth text not null default 'standard',
  quality_filter text not null default 'reviewable',
  min_rating numeric not null default 0,
  min_reviews integer not null default 5,
  status text not null default 'completed' check (status in ('completed', 'failed')),
  total_found integer not null default 0,
  fresh_count integer not null default 0,
  dialable_count integer not null default 0,
  a_grade_count integer not null default 0,
  no_website_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.discovered_leads (
  id uuid primary key default gen_random_uuid(),
  discovery_run_id uuid not null references public.discovery_runs(id) on delete cascade,
  source text not null,
  source_place_id text not null,
  business_name text not null,
  phone text null,
  website_url text null,
  industry text null,
  location text null,
  address text null,
  has_website boolean not null default false,
  website_quality text not null default 'no_website',
  website_signals text[] not null default '{}',
  conversion_strength text not null default 'none',
  has_booking_system boolean not null default false,
  booking_system text null,
  contactability_score integer not null default 0 check (contactability_score between 0 and 100),
  website_gap text not null default 'unverified',
  discovery_fit text not null default 'research',
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  opportunity_grade text not null default 'D' check (opportunity_grade in ('A', 'B', 'C', 'D')),
  priority_label text not null default 'Research first',
  score_reasons text[] not null default '{}',
  is_existing_lead boolean not null default false,
  existing_lead_id uuid null references public.leads(id) on delete set null,
  promoted_lead_id uuid null references public.leads(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (discovery_run_id, source, source_place_id)
);

alter table public.discovery_runs
  drop constraint if exists discovery_runs_provider_check;

alter table public.discovery_runs
  add constraint discovery_runs_provider_check
  check (provider in ('auto', 'google_places', 'yelp', 'osm_overpass'));

alter table public.discovery_runs
  add column if not exists search_depth text not null default 'standard',
  add column if not exists quality_filter text not null default 'reviewable',
  add column if not exists min_rating numeric not null default 0,
  add column if not exists min_reviews integer not null default 5;

alter table public.discovery_runs
  drop constraint if exists discovery_runs_search_depth_check;

alter table public.discovery_runs
  add constraint discovery_runs_search_depth_check
  check (search_depth in ('focused', 'standard', 'deep'));

alter table public.discovery_runs
  drop constraint if exists discovery_runs_quality_filter_check;

alter table public.discovery_runs
  add constraint discovery_runs_quality_filter_check
  check (quality_filter in ('call_ready', 'reviewable', 'all'));

alter table public.discovery_runs
  drop constraint if exists discovery_runs_min_rating_check;

alter table public.discovery_runs
  add constraint discovery_runs_min_rating_check
  check (min_rating between 0 and 5);

alter table public.discovery_runs
  drop constraint if exists discovery_runs_min_reviews_check;

alter table public.discovery_runs
  add constraint discovery_runs_min_reviews_check
  check (min_reviews between 0 and 500);

alter table public.discovered_leads
  drop constraint if exists discovered_leads_source_check;

alter table public.discovered_leads
  add constraint discovered_leads_source_check
  check (source in ('google_places', 'yelp', 'osm_overpass'));

alter table public.discovered_leads
  drop constraint if exists discovered_leads_website_quality_check;

alter table public.discovered_leads
  add constraint discovered_leads_website_quality_check
  check (website_quality in ('no_website', 'unreachable', 'thin', 'basic', 'solid'));

alter table public.discovered_leads
  add column if not exists conversion_strength text not null default 'none';

alter table public.discovered_leads
  drop constraint if exists discovered_leads_conversion_strength_check;

alter table public.discovered_leads
  add constraint discovered_leads_conversion_strength_check
  check (conversion_strength in ('none', 'weak', 'moderate', 'strong'));

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

create index if not exists leads_account_id_idx on public.leads(account_id);
create index if not exists leads_status_idx on public.leads(lead_status);
create index if not exists leads_industry_idx on public.leads(industry);
create index if not exists leads_website_status_idx on public.leads(website_status);
create index if not exists leads_next_follow_up_idx on public.leads(next_follow_up);
create index if not exists leads_business_name_idx on public.leads using gin (business_name gin_trgm_ops);
create index if not exists leads_source_place_idx on public.leads(source, source_place_id);
create index if not exists leads_has_website_idx on public.leads(has_website);
create index if not exists leads_has_booking_system_idx on public.leads(has_booking_system);
create index if not exists leads_discovery_fit_idx on public.leads(discovery_fit);
create index if not exists leads_website_gap_idx on public.leads(website_gap);
create index if not exists leads_contactability_score_idx on public.leads(contactability_score desc);
create index if not exists leads_lead_score_idx on public.leads(lead_score desc);
create index if not exists interactions_lead_id_idx on public.interactions(lead_id);
create index if not exists deals_lead_id_idx on public.deals(lead_id);
create index if not exists discovery_runs_created_at_idx on public.discovery_runs(created_at desc);
create index if not exists discovery_runs_query_location_idx on public.discovery_runs(query, location);
create index if not exists discovery_runs_methodology_idx on public.discovery_runs(provider, search_depth, quality_filter);
create index if not exists discovered_leads_run_score_idx on public.discovered_leads(discovery_run_id, lead_score desc);
create index if not exists discovered_leads_grade_idx on public.discovered_leads(opportunity_grade);
create index if not exists discovered_leads_dialable_idx on public.discovered_leads(discovery_run_id) where phone is not null;
create index if not exists discovered_leads_fit_score_idx on public.discovered_leads(discovery_run_id, discovery_fit, lead_score desc);
create index if not exists discovered_leads_website_gap_idx on public.discovered_leads(website_gap);
create index if not exists discovered_leads_contactability_score_idx on public.discovered_leads(contactability_score desc);
create index if not exists discovered_leads_existing_idx on public.discovered_leads(existing_lead_id) where existing_lead_id is not null;
create index if not exists discovered_leads_promoted_idx on public.discovered_leads(promoted_lead_id) where promoted_lead_id is not null;
create index if not exists api_usage_events_provider_created_at_idx on public.api_usage_events(provider, created_at desc);

insert into public.pricing_templates (template_name, one_time_price, monthly_price, is_default)
values ('Starter website', 500, 20, true)
on conflict do nothing;

insert into public.pitch_templates (industry, template_name, message_body)
values
  ('Restaurant', 'Restaurant outreach', 'I noticed {{business_name}} could make it easier for hungry local customers to view your menu, order, and contact you online.'),
  ('Service Business', 'Service business outreach', 'I help local service businesses turn searches and social clicks into calls, quote requests, and booked work.')
on conflict do nothing;

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.leads to anon, authenticated;
grant select, insert, update, delete on table public.interactions to anon, authenticated;
grant select, insert, update, delete on table public.pitch_templates to anon, authenticated;
grant select, insert, update, delete on table public.deals to anon, authenticated;
grant select, insert, update, delete on table public.pricing_templates to anon, authenticated;
grant select, insert, update, delete on table public.discovery_runs to anon, authenticated;
grant select, insert, update, delete on table public.discovered_leads to anon, authenticated;
grant select, insert, update, delete on table public.api_usage_events to anon, authenticated;

alter table public.leads enable row level security;
alter table public.interactions enable row level security;
alter table public.pitch_templates enable row level security;
alter table public.deals enable row level security;
alter table public.pricing_templates enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovered_leads enable row level security;
alter table public.api_usage_events enable row level security;

drop policy if exists "mvp anon select leads" on public.leads;
drop policy if exists "mvp anon insert leads" on public.leads;
drop policy if exists "mvp anon update leads" on public.leads;
drop policy if exists "mvp anon delete leads" on public.leads;
create policy "mvp anon select leads" on public.leads for select to anon, authenticated using (true);
create policy "mvp anon insert leads" on public.leads for insert to anon, authenticated with check (true);
create policy "mvp anon update leads" on public.leads for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete leads" on public.leads for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select interactions" on public.interactions;
drop policy if exists "mvp anon insert interactions" on public.interactions;
drop policy if exists "mvp anon update interactions" on public.interactions;
drop policy if exists "mvp anon delete interactions" on public.interactions;
create policy "mvp anon select interactions" on public.interactions for select to anon, authenticated using (true);
create policy "mvp anon insert interactions" on public.interactions for insert to anon, authenticated with check (true);
create policy "mvp anon update interactions" on public.interactions for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete interactions" on public.interactions for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select pitch_templates" on public.pitch_templates;
drop policy if exists "mvp anon insert pitch_templates" on public.pitch_templates;
drop policy if exists "mvp anon update pitch_templates" on public.pitch_templates;
drop policy if exists "mvp anon delete pitch_templates" on public.pitch_templates;
create policy "mvp anon select pitch_templates" on public.pitch_templates for select to anon, authenticated using (true);
create policy "mvp anon insert pitch_templates" on public.pitch_templates for insert to anon, authenticated with check (true);
create policy "mvp anon update pitch_templates" on public.pitch_templates for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete pitch_templates" on public.pitch_templates for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select deals" on public.deals;
drop policy if exists "mvp anon insert deals" on public.deals;
drop policy if exists "mvp anon update deals" on public.deals;
drop policy if exists "mvp anon delete deals" on public.deals;
create policy "mvp anon select deals" on public.deals for select to anon, authenticated using (true);
create policy "mvp anon insert deals" on public.deals for insert to anon, authenticated with check (true);
create policy "mvp anon update deals" on public.deals for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete deals" on public.deals for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select pricing_templates" on public.pricing_templates;
drop policy if exists "mvp anon insert pricing_templates" on public.pricing_templates;
drop policy if exists "mvp anon update pricing_templates" on public.pricing_templates;
drop policy if exists "mvp anon delete pricing_templates" on public.pricing_templates;
create policy "mvp anon select pricing_templates" on public.pricing_templates for select to anon, authenticated using (true);
create policy "mvp anon insert pricing_templates" on public.pricing_templates for insert to anon, authenticated with check (true);
create policy "mvp anon update pricing_templates" on public.pricing_templates for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete pricing_templates" on public.pricing_templates for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select discovery_runs" on public.discovery_runs;
drop policy if exists "mvp anon insert discovery_runs" on public.discovery_runs;
drop policy if exists "mvp anon update discovery_runs" on public.discovery_runs;
drop policy if exists "mvp anon delete discovery_runs" on public.discovery_runs;
create policy "mvp anon select discovery_runs" on public.discovery_runs for select to anon, authenticated using (true);
create policy "mvp anon insert discovery_runs" on public.discovery_runs for insert to anon, authenticated with check (true);
create policy "mvp anon update discovery_runs" on public.discovery_runs for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete discovery_runs" on public.discovery_runs for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select discovered_leads" on public.discovered_leads;
drop policy if exists "mvp anon insert discovered_leads" on public.discovered_leads;
drop policy if exists "mvp anon update discovered_leads" on public.discovered_leads;
drop policy if exists "mvp anon delete discovered_leads" on public.discovered_leads;
create policy "mvp anon select discovered_leads" on public.discovered_leads for select to anon, authenticated using (true);
create policy "mvp anon insert discovered_leads" on public.discovered_leads for insert to anon, authenticated with check (true);
create policy "mvp anon update discovered_leads" on public.discovered_leads for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete discovered_leads" on public.discovered_leads for delete to anon, authenticated using (true);

drop policy if exists "mvp anon select api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon insert api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon update api_usage_events" on public.api_usage_events;
drop policy if exists "mvp anon delete api_usage_events" on public.api_usage_events;
create policy "mvp anon select api_usage_events" on public.api_usage_events for select to anon, authenticated using (true);
create policy "mvp anon insert api_usage_events" on public.api_usage_events for insert to anon, authenticated with check (true);
create policy "mvp anon update api_usage_events" on public.api_usage_events for update to anon, authenticated using (true) with check (true);
create policy "mvp anon delete api_usage_events" on public.api_usage_events for delete to anon, authenticated using (true);

notify pgrst, 'reload schema';
