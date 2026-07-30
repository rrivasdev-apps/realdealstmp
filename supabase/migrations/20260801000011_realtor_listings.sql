-- Phase 2.5 (Contact Hub): the last Realtor sub-section from
-- docs/reference/contact-hub.md -- "listings tied to this realtor, with an
-- Add Listing button." The doc gives no further field detail, so this is
-- deliberately minimal: address, price, status, listing date, notes. Scoped
-- through contact_id -> contacts.company_id, same pattern as offers/showings
-- (no company_id of its own on a child entity).

create table listing_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null
);

insert into listing_statuses (name, sort_order) values
  ('Active', 1), ('Pending', 2), ('Sold', 3), ('Expired', 4), ('Withdrawn', 5);

alter table listing_statuses enable row level security;
create policy "Authenticated users can read listing statuses"
  on listing_statuses for select using (auth.uid() is not null);

create table realtor_listings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  address text not null,
  list_price numeric,
  status_id uuid references listing_statuses (id),
  listing_date date,
  notes text,
  created_at timestamptz not null default now()
);

create index realtor_listings_contact_id_idx on realtor_listings (contact_id);

alter table realtor_listings enable row level security;

create policy "Members can read listings for their company's contacts"
  on realtor_listings for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can create listings for their company's contacts"
  on realtor_listings for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can update listings for their company's contacts"
  on realtor_listings for update using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can delete listings for their company's contacts"
  on realtor_listings for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
