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

create index if not exists leads_account_id_idx on public.leads(account_id);
create index if not exists leads_status_idx on public.leads(lead_status);
create index if not exists leads_industry_idx on public.leads(industry);
create index if not exists leads_website_status_idx on public.leads(website_status);
create index if not exists leads_next_follow_up_idx on public.leads(next_follow_up);
create index if not exists leads_business_name_idx on public.leads using gin (business_name gin_trgm_ops);
create index if not exists interactions_lead_id_idx on public.interactions(lead_id);
create index if not exists deals_lead_id_idx on public.deals(lead_id);

insert into public.pricing_templates (template_name, one_time_price, monthly_price, is_default)
values ('Starter website', 500, 20, true)
on conflict do nothing;

insert into public.pitch_templates (industry, template_name, message_body)
values
  ('Restaurant', 'Restaurant outreach', 'I noticed {{business_name}} could make it easier for hungry local customers to view your menu, order, and contact you online.'),
  ('Service Business', 'Service business outreach', 'I help local service businesses turn searches and social clicks into calls, quote requests, and booked work.')
on conflict do nothing;
