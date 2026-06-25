-- Development policies.
-- These allow the current single-user app to read and write with the anon key.
-- Replace with account/user-scoped policies before production or public launch.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.leads to anon, authenticated;
grant select, insert, update, delete on table public.interactions to anon, authenticated;
grant select, insert, update, delete on table public.pitch_templates to anon, authenticated;
grant select, insert, update, delete on table public.deals to anon, authenticated;
grant select, insert, update, delete on table public.pricing_templates to anon, authenticated;
grant select, insert, update, delete on table public.discovery_runs to anon, authenticated;
grant select, insert, update, delete on table public.discovered_leads to anon, authenticated;

alter table public.leads enable row level security;
alter table public.interactions enable row level security;
alter table public.pitch_templates enable row level security;
alter table public.deals enable row level security;
alter table public.pricing_templates enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovered_leads enable row level security;

drop policy if exists "dev anon select leads" on public.leads;
drop policy if exists "dev anon insert leads" on public.leads;
drop policy if exists "dev anon update leads" on public.leads;
drop policy if exists "dev anon delete leads" on public.leads;
create policy "dev anon select leads" on public.leads for select to anon, authenticated using (true);
create policy "dev anon insert leads" on public.leads for insert to anon, authenticated with check (true);
create policy "dev anon update leads" on public.leads for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete leads" on public.leads for delete to anon, authenticated using (true);

drop policy if exists "dev anon select interactions" on public.interactions;
drop policy if exists "dev anon insert interactions" on public.interactions;
drop policy if exists "dev anon update interactions" on public.interactions;
drop policy if exists "dev anon delete interactions" on public.interactions;
create policy "dev anon select interactions" on public.interactions for select to anon, authenticated using (true);
create policy "dev anon insert interactions" on public.interactions for insert to anon, authenticated with check (true);
create policy "dev anon update interactions" on public.interactions for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete interactions" on public.interactions for delete to anon, authenticated using (true);

drop policy if exists "dev anon select pitch_templates" on public.pitch_templates;
drop policy if exists "dev anon insert pitch_templates" on public.pitch_templates;
drop policy if exists "dev anon update pitch_templates" on public.pitch_templates;
drop policy if exists "dev anon delete pitch_templates" on public.pitch_templates;
create policy "dev anon select pitch_templates" on public.pitch_templates for select to anon, authenticated using (true);
create policy "dev anon insert pitch_templates" on public.pitch_templates for insert to anon, authenticated with check (true);
create policy "dev anon update pitch_templates" on public.pitch_templates for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete pitch_templates" on public.pitch_templates for delete to anon, authenticated using (true);

drop policy if exists "dev anon select deals" on public.deals;
drop policy if exists "dev anon insert deals" on public.deals;
drop policy if exists "dev anon update deals" on public.deals;
drop policy if exists "dev anon delete deals" on public.deals;
create policy "dev anon select deals" on public.deals for select to anon, authenticated using (true);
create policy "dev anon insert deals" on public.deals for insert to anon, authenticated with check (true);
create policy "dev anon update deals" on public.deals for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete deals" on public.deals for delete to anon, authenticated using (true);

drop policy if exists "dev anon select pricing_templates" on public.pricing_templates;
drop policy if exists "dev anon insert pricing_templates" on public.pricing_templates;
drop policy if exists "dev anon update pricing_templates" on public.pricing_templates;
drop policy if exists "dev anon delete pricing_templates" on public.pricing_templates;
create policy "dev anon select pricing_templates" on public.pricing_templates for select to anon, authenticated using (true);
create policy "dev anon insert pricing_templates" on public.pricing_templates for insert to anon, authenticated with check (true);
create policy "dev anon update pricing_templates" on public.pricing_templates for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete pricing_templates" on public.pricing_templates for delete to anon, authenticated using (true);

drop policy if exists "dev anon select discovery_runs" on public.discovery_runs;
drop policy if exists "dev anon insert discovery_runs" on public.discovery_runs;
drop policy if exists "dev anon update discovery_runs" on public.discovery_runs;
drop policy if exists "dev anon delete discovery_runs" on public.discovery_runs;
create policy "dev anon select discovery_runs" on public.discovery_runs for select to anon, authenticated using (true);
create policy "dev anon insert discovery_runs" on public.discovery_runs for insert to anon, authenticated with check (true);
create policy "dev anon update discovery_runs" on public.discovery_runs for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete discovery_runs" on public.discovery_runs for delete to anon, authenticated using (true);

drop policy if exists "dev anon select discovered_leads" on public.discovered_leads;
drop policy if exists "dev anon insert discovered_leads" on public.discovered_leads;
drop policy if exists "dev anon update discovered_leads" on public.discovered_leads;
drop policy if exists "dev anon delete discovered_leads" on public.discovered_leads;
create policy "dev anon select discovered_leads" on public.discovered_leads for select to anon, authenticated using (true);
create policy "dev anon insert discovered_leads" on public.discovered_leads for insert to anon, authenticated with check (true);
create policy "dev anon update discovered_leads" on public.discovered_leads for update to anon, authenticated using (true) with check (true);
create policy "dev anon delete discovered_leads" on public.discovered_leads for delete to anon, authenticated using (true);

notify pgrst, 'reload schema';
