-- Replaces investor_llcs with a fuller "company" entity (title companies,
-- brokerages, mortgage companies -- not just investor LLCs), matching the
-- original app's "Business Companies" screen. See docs/reference/deal-form.md
-- and docs/reference/contact-hub.md for the reference spec. Contact (POC)
-- linking is deferred to a future Contact Hub milestone -- this migration
-- only covers the company record itself.

create table company_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

insert into company_types (name) values
  ('Investor'), ('JV Partner'), ('Title Company'), ('Brokerage'), ('Mortgage Company');

alter table company_types enable row level security;

create policy "Authenticated users can read company types"
  on company_types for select using (auth.uid() is not null);

create table partner_companies (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  address text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

-- Company can be multiple types at once (e.g. Investor + JV Partner), same
-- pattern as contact_contact_types.
create table partner_company_types (
  partner_company_id uuid not null references partner_companies (id) on delete cascade,
  company_type_id uuid not null references company_types (id) on delete cascade,
  primary key (partner_company_id, company_type_id)
);

create index partner_companies_company_id_idx on partner_companies (company_id);

alter table partner_companies enable row level security;
alter table partner_company_types enable row level security;

create policy "Members can read their company's partner companies"
  on partner_companies for select using (is_company_member(company_id));
create policy "Members can create partner companies for their company"
  on partner_companies for insert with check (is_company_member(company_id));
create policy "Members can update their company's partner companies"
  on partner_companies for update using (is_company_member(company_id));
create policy "Members can delete their company's partner companies"
  on partner_companies for delete using (is_company_member(company_id));

create policy "Members can read company types for their company's partner companies"
  on partner_company_types for select using (
    exists (
      select 1 from partner_companies
      where partner_companies.id = partner_company_id and is_company_member(partner_companies.company_id)
    )
  );
create policy "Members can set company types for their company's partner companies"
  on partner_company_types for insert with check (
    exists (
      select 1 from partner_companies
      where partner_companies.id = partner_company_id and is_company_member(partner_companies.company_id)
    )
  );
create policy "Members can remove company types for their company's partner companies"
  on partner_company_types for delete using (
    exists (
      select 1 from partner_companies
      where partner_companies.id = partner_company_id and is_company_member(partner_companies.company_id)
    )
  );

-- Carry existing investor_llcs rows over with the same ids so
-- deals.jv_partner_company_id keeps resolving without remapping.
insert into partner_companies (id, company_id, name, created_at)
  select id, company_id, name, created_at from investor_llcs;

alter table deals drop constraint deals_jv_partner_company_id_fkey;
alter table deals add constraint deals_jv_partner_company_id_fkey
  foreign key (jv_partner_company_id) references partner_companies (id);

drop table investor_llcs;
