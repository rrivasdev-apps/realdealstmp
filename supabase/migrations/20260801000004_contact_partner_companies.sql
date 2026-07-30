-- Phase 2.5 (Contact Hub): links contacts to partner_companies (their LLC,
-- brokerage, etc.), replacing the abandoned investor_llc_id column. Contact
-- is the primary entity related to a deal; a linked partner_companies row is
-- an optional attribute of that contact (Add LLC / Link to LLC), not a
-- duplicate record -- see docs/reference/contact-hub.md's "LLC Details"
-- section and CLAUDE.md's Phase 2.5 spec.

create table contact_partner_companies (
  contact_id uuid not null references contacts (id) on delete cascade,
  partner_company_id uuid not null references partner_companies (id) on delete cascade,
  primary key (contact_id, partner_company_id)
);

alter table contact_partner_companies enable row level security;

-- Existing rows are guaranteed same-tenant by the insert check below, so
-- select/delete only need to confirm the caller belongs to the contact's
-- company, same pattern as contact_phone_numbers/contact_emails.
create policy "Members can read their company's contact-company links"
  on contact_partner_companies for select using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

-- Insert must confirm contact and partner_company belong to the SAME
-- company_id -- otherwise a member could link their own contact to another
-- tenant's partner_company row by guessing its id.
create policy "Members can create contact-company links for their company"
  on contact_partner_companies for insert with check (
    exists (
      select 1 from contacts
      join partner_companies on partner_companies.company_id = contacts.company_id
      where contacts.id = contact_id
        and partner_companies.id = partner_company_id
        and is_company_member(contacts.company_id)
    )
  );

create policy "Members can remove contact-company links for their company"
  on contact_partner_companies for delete using (
    exists (select 1 from contacts where contacts.id = contact_id and is_company_member(contacts.company_id))
  );

-- Dead column: predates partner_companies, never had a working FK (see
-- 20260715000004_contacts.sql's comment), fully superseded by
-- contact_partner_companies above. Confirmed empty in production before
-- dropping.
alter table contacts drop column investor_llc_id;

-- JV partner needs both a company AND a contact
-- (docs/reference/deal-form.md) -- today only jv_partner_company_id exists.
alter table deals add column jv_partner_contact_id uuid references contacts (id);
