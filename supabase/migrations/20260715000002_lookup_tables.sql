-- Global, fixed lookup tables: read-only via RLS, seeded once here, no
-- per-company variation and no Settings UI to edit them yet (Phase 2).
create table deal_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null
);

create table contact_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table phone_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table email_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into deal_statuses (name, sort_order) values
  ('For Sale', 1),
  ('Pending Sale', 2),
  ('Closed', 3),
  ('On Hold', 4),
  ('Cancelled', 5);

insert into contact_types (name) values
  ('Investor'), ('Realtor'), ('Lender'), ('Vendor'),
  ('Seller'), ('Mortgage Company'), ('Other');

insert into property_types (name) values
  ('Single Family'), ('Multi-Family'), ('Land'),
  ('Condo/Townhouse'), ('Mobile/Manufactured');

insert into phone_types (name) values
  ('Mobile'), ('Home'), ('Work'), ('Other');

insert into email_types (name) values
  ('Personal'), ('Work'), ('Other');

alter table deal_statuses enable row level security;
alter table contact_types enable row level security;
alter table property_types enable row level security;
alter table phone_types enable row level security;
alter table email_types enable row level security;

create policy "Authenticated users can read deal statuses"
  on deal_statuses for select using (auth.uid() is not null);
create policy "Authenticated users can read contact types"
  on contact_types for select using (auth.uid() is not null);
create policy "Authenticated users can read property types"
  on property_types for select using (auth.uid() is not null);
create policy "Authenticated users can read phone types"
  on phone_types for select using (auth.uid() is not null);
create policy "Authenticated users can read email types"
  on email_types for select using (auth.uid() is not null);

-- Company-scoped lookups: "company-configurable, matches Settings module"
-- per docs/data-model.md. No Settings UI yet, so no migration seed data --
-- each company's rows are seeded by /api/signup at signup time instead.
create table markets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null
);

create table deal_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null
);

create table lead_sources (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null
);

create index markets_company_id_idx on markets (company_id);
create index deal_types_company_id_idx on deal_types (company_id);
create index lead_sources_company_id_idx on lead_sources (company_id);

alter table markets enable row level security;
alter table deal_types enable row level security;
alter table lead_sources enable row level security;

create policy "Members can read their company's markets"
  on markets for select using (is_company_member(company_id));
create policy "Members can read their company's deal types"
  on deal_types for select using (is_company_member(company_id));
create policy "Members can read their company's lead sources"
  on lead_sources for select using (is_company_member(company_id));
