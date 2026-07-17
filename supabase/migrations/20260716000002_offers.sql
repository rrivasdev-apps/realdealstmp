-- Offers a deal receives before a buyer is locked into the BC contract.
-- See docs/data-model.md's `offers` entity. Lookup seed values are a
-- best guess (the source screens didn't fully enumerate them) -- these are
-- plain rows with no Settings UI yet, same as markets/deal_types, so they're
-- directly editable via the Supabase table editor if they need correcting.
create table offer_statuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null
);

create table purchase_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into offer_statuses (name, sort_order) values
  ('Pending', 1),
  ('Accepted', 2),
  ('Countered', 3),
  ('Rejected', 4),
  ('Expired', 5);

insert into purchase_types (name) values
  ('Cash'),
  ('Conventional Financing'),
  ('Hard Money / Private Lending'),
  ('Subject-To'),
  ('Seller Financing'),
  ('Other');

alter table offer_statuses enable row level security;
alter table purchase_types enable row level security;

create policy "Authenticated users can read offer statuses"
  on offer_statuses for select using (auth.uid() is not null);
create policy "Authenticated users can read purchase types"
  on purchase_types for select using (auth.uid() is not null);

create table offers (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  offer_price numeric,
  offer_date date,
  status_id uuid not null references offer_statuses (id),
  inspection_deadline date,
  closing_deadline date,
  emd_deadline date,
  purchase_type_id uuid references purchase_types (id),
  realtor_contact_id uuid references contacts (id),
  investor_contact_id uuid references contacts (id),
  notes text,
  created_at timestamptz not null default now()
);

create index offers_deal_id_idx on offers (deal_id);

alter table offers enable row level security;

-- Offers have no company_id of their own -- scope through the parent deal,
-- same pattern as contact_phone_numbers/contact_emails.
create policy "Members can read offers for their company's deals"
  on offers for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can create offers for their company's deals"
  on offers for insert with check (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can update offers for their company's deals"
  on offers for update using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
