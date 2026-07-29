-- Standardized Country/State/City geography for deal addresses. Company-scoped,
-- hierarchical lookups (City -> State -> Country), same shape as markets/deal_types/
-- lead_sources (company_id + is_company_member() RLS), so consistency only needs to
-- hold within one company's data, not globally. Seeding (full country list always,
-- full US states/cities when the company's home country is US) happens from the
-- signup route in application code -- see src/lib/geography/seed-company.ts -- not
-- here, since the US cities dataset is ~30k rows and belongs in a bundled JSON asset,
-- not an SQL migration. deals.city/deals.state (free text, added in
-- 20260801000001_deal_address_components.sql) are backfilled into the new FK columns
-- by a one-time script and dropped in a follow-up migration once that's confirmed --
-- kept here for now so this migration stays purely additive.

create table countries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  iso_code text not null, -- ISO 3166-1 alpha-2, e.g. "US" -- matches Google Places' country shortText
  created_at timestamptz not null default now()
);
create index countries_company_id_idx on countries (company_id);
create unique index countries_company_iso_idx on countries (company_id, upper(iso_code));

create table states (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  country_id uuid not null references countries (id) on delete cascade,
  name text not null, -- full name, e.g. "Texas" -- always populated, used for display and name-based lookup
  code text, -- abbreviation, e.g. "TX" -- populated for the US seed; nullable since not every country has one
  created_at timestamptz not null default now()
);
create index states_company_id_idx on states (company_id);
create index states_country_id_idx on states (country_id);
create unique index states_country_name_idx on states (country_id, lower(name));
create unique index states_country_code_idx on states (country_id, upper(code)) where code is not null;

create table cities (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  state_id uuid not null references states (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create index cities_company_id_idx on cities (company_id);
create index cities_state_id_idx on cities (state_id);
create unique index cities_state_name_idx on cities (state_id, lower(name));
-- Prefix search backs the Cities Settings section and the deal-form city combobox,
-- both of which query by state_id + a typed name prefix rather than rendering the
-- full (often several-thousand-row) list.
create index cities_state_name_prefix_idx on cities (state_id, name text_pattern_ops);

alter table countries enable row level security;
create policy "Members can read their company's countries"
  on countries for select using (is_company_member(company_id));
create policy "Members can create countries for their company"
  on countries for insert with check (is_company_member(company_id));

alter table states enable row level security;
create policy "Members can read their company's states"
  on states for select using (is_company_member(company_id));
create policy "Members can create states for their company"
  on states for insert with check (is_company_member(company_id));

alter table cities enable row level security;
create policy "Members can read their company's cities"
  on cities for select using (is_company_member(company_id));
create policy "Members can create cities for their company"
  on cities for insert with check (is_company_member(company_id));

-- The company's default country for new deals/address entry -- set from the signup
-- form's home-country choice, editable later in Settings.
alter table companies add column default_country_id uuid references countries (id) on delete set null;

-- Nullable and purely additive alongside the existing free-text city/state -- the
-- backfill script populates these from the old columns before a follow-up migration
-- drops city/state entirely. zip_code is untouched: it stays free text, not part of
-- this hierarchy.
alter table deals
  add column country_id uuid references countries (id) on delete set null,
  add column state_id uuid references states (id) on delete set null,
  add column city_id uuid references cities (id) on delete set null;
