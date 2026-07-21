-- Employee Center, piece 4e: which ContactHub contact_types a role's
-- members can see, from Rafael's reference (role edit page had a
-- ContactHub-types checklist alongside capabilities/commission types).
-- Same join-table shape as employee_role_commission_types, but contact_types
-- is a *global* fixed lookup (no company_id of its own -- confirmed in
-- 20260715000002_lookup_tables.sql), so this table is scoped entirely
-- through employee_role_id's company, not through the contact_type side.
--
-- Visibility scoping only: this pass adds the schema + the role-editor
-- checklist. It does NOT yet filter what an employee actually sees in
-- Contact Hub (that would mean threading role-derived allowed-contact-types
-- through every contact list/picker query in the app) -- a known,
-- deliberate limitation for now, not an oversight.
create table employee_role_contact_types (
  employee_role_id uuid not null references employee_roles (id) on delete cascade,
  contact_type_id uuid not null references contact_types (id) on delete cascade,
  primary key (employee_role_id, contact_type_id)
);

alter table employee_role_contact_types enable row level security;

create policy "Members can read their company's employee role contact types"
  on employee_role_contact_types for select using (
    exists (
      select 1 from employee_roles
      where employee_roles.id = employee_role_id and is_company_member(employee_roles.company_id)
    )
  );
create policy "Managers can assign employee role contact types for their company"
  on employee_role_contact_types for insert with check (
    exists (
      select 1 from employee_roles
      where employee_roles.id = employee_role_id and can_manage_settings(employee_roles.company_id)
    )
  );
create policy "Managers can remove employee role contact types for their company"
  on employee_role_contact_types for delete using (
    exists (
      select 1 from employee_roles
      where employee_roles.id = employee_role_id and can_manage_settings(employee_roles.company_id)
    )
  );
