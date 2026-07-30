-- Phase 2.5 (Contact Hub): the Realtor sub-tab (distinct from "Brokerage")
-- from docs/reference/contact-hub.md -- Select Industry(s), Select Asset
-- Type(s), Select Specialty(s), all multi-select. Fixed global lookups (not
-- company-scoped) since the doc gives exact, closed value lists, same
-- pattern as investor_types/communication_preferences. realtor_asset_types
-- is deliberately its own lookup, not a reuse of property_types -- the
-- doc's list (Single Family Residence, Multiple Family Residence, Mobile,
-- Office, Mobile Home Park, Storage, Warehouse, Retail, Flex, Land, Land
-- Development, Agriculture) is a broader specialization taxonomy than the
-- deal-level property_types list and the two shouldn't be conflated.

create table realtor_industries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into realtor_industries (name) values
  ('Commercial'), ('Residential'), ('Industrial');

create table realtor_asset_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into realtor_asset_types (name) values
  ('Single Family Residence'), ('Multiple Family Residence'), ('Mobile'),
  ('Office'), ('Mobile Home Park'), ('Storage'), ('Warehouse'), ('Retail'),
  ('Flex'), ('Land'), ('Land Development'), ('Agriculture');

create table realtor_specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into realtor_specialties (name) values
  ('REO'), ('Shortsale'), ('Creative'), ('Seller Finance'), ('SubTo'), ('Novation'), ('Wholesale');

alter table realtor_industries enable row level security;
alter table realtor_asset_types enable row level security;
alter table realtor_specialties enable row level security;

create policy "Authenticated users can read realtor industries"
  on realtor_industries for select using (auth.uid() is not null);
create policy "Authenticated users can read realtor asset types"
  on realtor_asset_types for select using (auth.uid() is not null);
create policy "Authenticated users can read realtor specialties"
  on realtor_specialties for select using (auth.uid() is not null);

create table contact_realtor_industries (
  contact_id uuid not null references contacts (id) on delete cascade,
  realtor_industry_id uuid not null references realtor_industries (id) on delete cascade,
  primary key (contact_id, realtor_industry_id)
);

create table contact_realtor_asset_types (
  contact_id uuid not null references contacts (id) on delete cascade,
  realtor_asset_type_id uuid not null references realtor_asset_types (id) on delete cascade,
  primary key (contact_id, realtor_asset_type_id)
);

create table contact_realtor_specialties (
  contact_id uuid not null references contacts (id) on delete cascade,
  realtor_specialty_id uuid not null references realtor_specialties (id) on delete cascade,
  primary key (contact_id, realtor_specialty_id)
);

alter table contact_realtor_industries enable row level security;
alter table contact_realtor_asset_types enable row level security;
alter table contact_realtor_specialties enable row level security;

create policy "Members can read realtor industries for their company's contacts"
  on contact_realtor_industries for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set realtor industries for their company's contacts"
  on contact_realtor_industries for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove realtor industries for their company's contacts"
  on contact_realtor_industries for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read realtor asset types for their company's contacts"
  on contact_realtor_asset_types for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set realtor asset types for their company's contacts"
  on contact_realtor_asset_types for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove realtor asset types for their company's contacts"
  on contact_realtor_asset_types for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read realtor specialties for their company's contacts"
  on contact_realtor_specialties for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set realtor specialties for their company's contacts"
  on contact_realtor_specialties for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove realtor specialties for their company's contacts"
  on contact_realtor_specialties for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
