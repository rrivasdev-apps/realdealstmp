create table contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  notes text,
  investor_llc_id uuid, -- Phase 3 (investor_llcs table doesn't exist yet); column only
  created_at timestamptz not null default now()
);

create table contact_contact_types (
  contact_id uuid not null references contacts (id) on delete cascade,
  contact_type_id uuid not null references contact_types (id) on delete cascade,
  primary key (contact_id, contact_type_id)
);

create table contact_phone_numbers (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  type_id uuid references phone_types (id),
  phone text not null
);

create table contact_emails (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts (id) on delete cascade,
  type_id uuid references email_types (id),
  email text not null
);

create index contacts_company_id_idx on contacts (company_id);
create index contact_phone_numbers_contact_id_idx on contact_phone_numbers (contact_id);
create index contact_emails_contact_id_idx on contact_emails (contact_id);

alter table contacts enable row level security;
alter table contact_contact_types enable row level security;
alter table contact_phone_numbers enable row level security;
alter table contact_emails enable row level security;

create policy "Members can read their company's contacts"
  on contacts for select using (is_company_member(company_id));
create policy "Members can create contacts for their company"
  on contacts for insert with check (is_company_member(company_id));
create policy "Members can update their company's contacts"
  on contacts for update using (is_company_member(company_id));

-- Child tables have no company_id of their own -- scope through the parent
-- contact row instead.
create policy "Members can read contact types for their company's contacts"
  on contact_contact_types for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can set contact types for their company's contacts"
  on contact_contact_types for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove contact types for their company's contacts"
  on contact_contact_types for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read phone numbers for their company's contacts"
  on contact_phone_numbers for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can add phone numbers for their company's contacts"
  on contact_phone_numbers for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can update phone numbers for their company's contacts"
  on contact_phone_numbers for update using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove phone numbers for their company's contacts"
  on contact_phone_numbers for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

create policy "Members can read emails for their company's contacts"
  on contact_emails for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can add emails for their company's contacts"
  on contact_emails for insert with check (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can update emails for their company's contacts"
  on contact_emails for update using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
create policy "Members can remove emails for their company's contacts"
  on contact_emails for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );
