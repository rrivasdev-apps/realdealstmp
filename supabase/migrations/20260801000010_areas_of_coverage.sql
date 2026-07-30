-- Phase 2.5 (Contact Hub): Realtor "Areas of Coverage" sub-section from
-- docs/reference/contact-hub.md -- States/Markets/Cities/Zip Codes Serving.
-- Reuses the same lookup tables as Investor Criteria/Preferences
-- (markets/cities/zip_codes) plus the existing states table, but through a
-- distinct set of join tables since "serving" is a different relationship
-- than "interested in" -- a contact can serve a market without being an
-- investor interested in it, and vice versa.

create table contact_states_serving (
  contact_id uuid not null references contacts (id) on delete cascade,
  state_id uuid not null references states (id) on delete cascade,
  primary key (contact_id, state_id)
);

create table contact_markets_serving (
  contact_id uuid not null references contacts (id) on delete cascade,
  market_id uuid not null references markets (id) on delete cascade,
  primary key (contact_id, market_id)
);

create table contact_cities_serving (
  contact_id uuid not null references contacts (id) on delete cascade,
  city_id uuid not null references cities (id) on delete cascade,
  primary key (contact_id, city_id)
);

create table contact_zip_codes_serving (
  contact_id uuid not null references contacts (id) on delete cascade,
  zip_code_id uuid not null references zip_codes (id) on delete cascade,
  primary key (contact_id, zip_code_id)
);

alter table contact_states_serving enable row level security;
alter table contact_markets_serving enable row level security;
alter table contact_cities_serving enable row level security;
alter table contact_zip_codes_serving enable row level security;

create policy "Members can read states serving for their company's contacts"
  on contact_states_serving for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set states serving for their company's contacts"
  on contact_states_serving for insert with check (
    exists (
      select 1 from contacts
      join states on states.company_id = contacts.company_id
      where contacts.id = contact_id and states.id = state_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove states serving for their company's contacts"
  on contact_states_serving for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read markets serving for their company's contacts"
  on contact_markets_serving for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set markets serving for their company's contacts"
  on contact_markets_serving for insert with check (
    exists (
      select 1 from contacts
      join markets on markets.company_id = contacts.company_id
      where contacts.id = contact_id and markets.id = market_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove markets serving for their company's contacts"
  on contact_markets_serving for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read cities serving for their company's contacts"
  on contact_cities_serving for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set cities serving for their company's contacts"
  on contact_cities_serving for insert with check (
    exists (
      select 1 from contacts
      join cities on cities.company_id = contacts.company_id
      where contacts.id = contact_id and cities.id = city_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove cities serving for their company's contacts"
  on contact_cities_serving for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read zip codes serving for their company's contacts"
  on contact_zip_codes_serving for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set zip codes serving for their company's contacts"
  on contact_zip_codes_serving for insert with check (
    exists (
      select 1 from contacts
      join zip_codes on zip_codes.company_id = contacts.company_id
      where contacts.id = contact_id and zip_codes.id = zip_code_id and is_company_member(contacts.company_id)
    )
  );
create policy "Members can remove zip codes serving for their company's contacts"
  on contact_zip_codes_serving for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
