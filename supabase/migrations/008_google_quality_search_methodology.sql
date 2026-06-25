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

create index if not exists discovery_runs_methodology_idx
  on public.discovery_runs(provider, search_depth, quality_filter);

notify pgrst, 'reload schema';
