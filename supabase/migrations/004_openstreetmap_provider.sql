alter table public.discovery_runs
  drop constraint if exists discovery_runs_provider_check;

alter table public.discovery_runs
  add constraint discovery_runs_provider_check
  check (provider in ('auto', 'google_places', 'yelp', 'osm_overpass'));

alter table public.discovered_leads
  drop constraint if exists discovered_leads_source_check;

alter table public.discovered_leads
  add constraint discovered_leads_source_check
  check (source in ('google_places', 'yelp', 'osm_overpass'));
