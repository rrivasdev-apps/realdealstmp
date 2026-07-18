-- Showings on a deal -- see docs/data-model.md's `showings` entity. Same
-- pattern as offers: no company_id of its own, scoped through the parent
-- deal; lookup seed values are a best guess (source screens only confirmed
-- "Scheduled"), directly editable via the Supabase table editor if wrong.
create table showing_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null
);

insert into showing_statuses (name, sort_order) values
  ('Scheduled', 1),
  ('Completed', 2),
  ('No-Show', 3),
  ('Cancelled', 4);

alter table showing_statuses enable row level security;

create policy "Authenticated users can read showing statuses"
  on showing_statuses for select using (auth.uid() is not null);

create table showings (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  showing_date date,
  status_id uuid not null references showing_statuses (id),
  buyer_contact_id uuid references contacts (id),
  vendor_contact_id uuid references contacts (id),
  details text,
  created_at timestamptz not null default now()
);

create index showings_deal_id_idx on showings (deal_id);

alter table showings enable row level security;

create policy "Members can read showings for their company's deals"
  on showings for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can create showings for their company's deals"
  on showings for insert with check (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can update showings for their company's deals"
  on showings for update using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
