create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid null,
  query text not null,
  location text not null,
  radius_miles integer not null default 10 check (radius_miles between 1 and 100),
  max_results integer not null default 10 check (max_results between 1 and 100),
  provider text not null default 'auto' check (provider in ('auto', 'google_places', 'yelp', 'osm_overpass')),
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
  source text not null check (source in ('google_places', 'yelp', 'osm_overpass')),
  source_place_id text not null,
  business_name text not null,
  phone text null,
  website_url text null,
  industry text null,
  location text null,
  address text null,
  has_website boolean not null default false,
  website_quality text not null default 'no_website'
    check (website_quality in ('no_website', 'unreachable', 'thin', 'basic', 'solid')),
  website_signals text[] not null default '{}',
  has_booking_system boolean not null default false,
  booking_system text null,
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

create index if not exists discovery_runs_created_at_idx on public.discovery_runs(created_at desc);
create index if not exists discovery_runs_query_location_idx on public.discovery_runs(query, location);
create index if not exists discovered_leads_run_score_idx on public.discovered_leads(discovery_run_id, lead_score desc);
create index if not exists discovered_leads_grade_idx on public.discovered_leads(opportunity_grade);
create index if not exists discovered_leads_dialable_idx on public.discovered_leads(discovery_run_id) where phone is not null;
create index if not exists discovered_leads_existing_idx on public.discovered_leads(existing_lead_id) where existing_lead_id is not null;
create index if not exists discovered_leads_promoted_idx on public.discovered_leads(promoted_lead_id) where promoted_lead_id is not null;
