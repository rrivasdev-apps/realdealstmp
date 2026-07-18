-- JV (joint venture) fields from the original app's Dispo tab -- see
-- docs/data-model.md's Dispo/JV section. `investor_llcs` is a standalone
-- entity (not a contact) so it can represent either an individual investor
-- or an LLC as the JV partner; contacts.investor_llc_id already has the
-- column reserved but linking that up is still Phase 3 (per CLAUDE.md), so
-- this migration only creates the table, not the contact-linking UI.
create table investor_llcs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index investor_llcs_company_id_idx on investor_llcs (company_id);

alter table investor_llcs enable row level security;

create policy "Members can read their company's investor LLCs"
  on investor_llcs for select using (is_company_member(company_id));
create policy "Members can create investor LLCs for their company"
  on investor_llcs for insert with check (is_company_member(company_id));

-- Global, fixed lookup -- same pattern as offer_statuses/purchase_types.
create table split_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into split_types (name) values
  ('Percentage'),
  ('Flat Fee');

alter table split_types enable row level security;

create policy "Authenticated users can read split types"
  on split_types for select using (auth.uid() is not null);

alter table deals
  add column is_jv_deal bool not null default false,
  add column jv_partner_company_id uuid references investor_llcs (id),
  add column jv_split_type_id uuid references split_types (id),
  add column jv_split_percent numeric,
  add column split_amount numeric;
