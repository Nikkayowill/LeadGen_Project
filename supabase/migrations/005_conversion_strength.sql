alter table public.discovered_leads
  add column if not exists conversion_strength text not null default 'none';

alter table public.discovered_leads
  drop constraint if exists discovered_leads_conversion_strength_check;

alter table public.discovered_leads
  add constraint discovered_leads_conversion_strength_check
  check (conversion_strength in ('none', 'weak', 'moderate', 'strong'));

notify pgrst, 'reload schema';
