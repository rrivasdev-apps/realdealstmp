-- Phase 2.5 (Contact Hub): Investor "Criteria/Preferences" sub-section from
-- docs/reference/contact-hub.md -- Type of Investor, Communication
-- Preferences, Markets/Cities/Zip Codes Interested In, Type of Deals
-- Interested In, Type of Properties Interested In. All multi-select, all
-- per-contact join tables. Markets/deal_types are already company-scoped
-- lookups reused as-is; property_types is the existing global lookup;
-- zip_codes is new (no prior lookup existed for it) and company-scoped like
-- markets, since a company builds up its own working zip code list ad-hoc
-- rather than importing a global one the way countries/states/cities do.

create table investor_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into investor_types (name) values
  ('Wholesaler'), ('Landlord'), ('Flipper'), ('JV Partner'), ('Funder');

alter table investor_types enable row level security;
create policy "Authenticated users can read investor types"
  on investor_types for select using (auth.uid() is not null);

create table communication_preferences (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into communication_preferences (name) values
  ('Phone'), ('Email'), ('Text'), ('Mail');

alter table communication_preferences enable row level security;
create policy "Authenticated users can read communication preferences"
  on communication_preferences for select using (auth.uid() is not null);

create table zip_codes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create index zip_codes_company_id_idx on zip_codes (company_id);

alter table zip_codes enable row level security;
create policy "Members can read their company's zip codes"
  on zip_codes for select using (is_company_member(company_id));
create policy "Members can create zip codes for their company"
  on zip_codes for insert with check (is_company_member(company_id));

-- One join table per criteria dimension -- same pattern as
-- contact_contact_types/contact_partner_companies: no company_id of their
-- own, scoped through the parent contact row.
create table contact_investor_types (
  contact_id uuid not null references contacts (id) on delete cascade,
  investor_type_id uuid not null references investor_types (id) on delete cascade,
  primary key (contact_id, investor_type_id)
);

create table contact_communication_preferences (
  contact_id uuid not null references contacts (id) on delete cascade,
  communication_preference_id uuid not null references communication_preferences (id) on delete cascade,
  primary key (contact_id, communication_preference_id)
);

create table contact_markets_interested (
  contact_id uuid not null references contacts (id) on delete cascade,
  market_id uuid not null references markets (id) on delete cascade,
  primary key (contact_id, market_id)
);

create table contact_cities_interested (
  contact_id uuid not null references contacts (id) on delete cascade,
  city_id uuid not null references cities (id) on delete cascade,
  primary key (contact_id, city_id)
);

create table contact_zip_codes_interested (
  contact_id uuid not null references contacts (id) on delete cascade,
  zip_code_id uuid not null references zip_codes (id) on delete cascade,
  primary key (contact_id, zip_code_id)
);

create table contact_deal_types_interested (
  contact_id uuid not null references contacts (id) on delete cascade,
  deal_type_id uuid not null references deal_types (id) on delete cascade,
  primary key (contact_id, deal_type_id)
);

create table contact_property_types_interested (
  contact_id uuid not null references contacts (id) on delete cascade,
  property_type_id uuid not null references property_types (id) on delete cascade,
  primary key (contact_id, property_type_id)
);

alter table contact_investor_types enable row level security;
alter table contact_communication_preferences enable row level security;
alter table contact_markets_interested enable row level security;
alter table contact_cities_interested enable row level security;
alter table contact_zip_codes_interested enable row level security;
alter table contact_deal_types_interested enable row level security;
alter table contact_property_types_interested enable row level security;

create policy "Members can read investor types for their company's contacts"
  on contact_investor_types for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set investor types for their company's contacts"
  on contact_investor_types for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove investor types for their company's contacts"
  on contact_investor_types for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read communication preferences for their company's contacts"
  on contact_communication_preferences for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set communication preferences for their company's contacts"
  on contact_communication_preferences for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove communication preferences for their company's contacts"
  on contact_communication_preferences for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

-- Markets interested -- insert must confirm the market belongs to the same
-- company as the contact (same cross-tenant guard as contact_partner_companies).
create policy "Members can read markets interested for their company's contacts"
  on contact_markets_interested for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set markets interested for their company's contacts"
  on contact_markets_interested for insert with check (
    exists (
      select 1 from contacts
      join markets on markets.company_id = contacts.company_id
      where contacts.id = contact_id and markets.id = market_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove markets interested for their company's contacts"
  on contact_markets_interested for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read cities interested for their company's contacts"
  on contact_cities_interested for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set cities interested for their company's contacts"
  on contact_cities_interested for insert with check (
    exists (
      select 1 from contacts
      join cities on cities.company_id = contacts.company_id
      where contacts.id = contact_id and cities.id = city_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove cities interested for their company's contacts"
  on contact_cities_interested for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read zip codes interested for their company's contacts"
  on contact_zip_codes_interested for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set zip codes interested for their company's contacts"
  on contact_zip_codes_interested for insert with check (
    exists (
      select 1 from contacts
      join zip_codes on zip_codes.company_id = contacts.company_id
      where contacts.id = contact_id and zip_codes.id = zip_code_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove zip codes interested for their company's contacts"
  on contact_zip_codes_interested for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read deal types interested for their company's contacts"
  on contact_deal_types_interested for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set deal types interested for their company's contacts"
  on contact_deal_types_interested for insert with check (
    exists (
      select 1 from contacts
      join deal_types on deal_types.company_id = contacts.company_id
      where contacts.id = contact_id and deal_types.id = deal_type_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove deal types interested for their company's contacts"
  on contact_deal_types_interested for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

-- Property types are a global lookup, not company-scoped -- no cross-tenant
-- guard needed on insert beyond the usual contact-membership check.
create policy "Members can read property types interested for their company's contacts"
  on contact_property_types_interested for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set property types interested for their company's contacts"
  on contact_property_types_interested for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove property types interested for their company's contacts"
  on contact_property_types_interested for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
