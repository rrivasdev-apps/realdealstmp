-- Minimal slice of Employee Sentinel (Phase 2) pulled forward to support the
-- commission engine: employees *are* profiles (no separate roster), each
-- optionally assigned an org-wide employee_role (job title, e.g.
-- "Acquisitions Manager") -- distinct from deal_employee_roles (TC/Closer on
-- a specific deal), which is a separate, later concept.
--
-- Company-scoped, admin-managed -- same shape as markets/deal_types, but
-- writable only by admins since role/commission config is sensitive.
create function is_company_admin(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and company_id = target_company_id and role = 'admin'
  );
$$;

create table employee_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index employee_roles_company_id_idx on employee_roles (company_id);

alter table employee_roles enable row level security;

create policy "Members can read their company's employee roles"
  on employee_roles for select using (is_company_member(company_id));
create policy "Admins can create employee roles for their company"
  on employee_roles for insert with check (is_company_admin(company_id));
create policy "Admins can update their company's employee roles"
  on employee_roles for update using (is_company_admin(company_id));
create policy "Admins can delete their company's employee roles"
  on employee_roles for delete using (is_company_admin(company_id));

alter table profiles
  add column employee_role_id uuid references employee_roles (id);

-- protect_profile_role_and_company already locks role/company_id on every
-- update; employee_role_id is deliberately left out of that trigger. Note
-- the existing profiles UPDATE policy only allows self-updates (id =
-- auth.uid()), so an admin setting *another* member's employee_role_id has
-- to go through the admin (service-role) client, gated by requireAdmin() in
-- the route -- same pattern /api/team/invite already uses, not a new broad
-- RLS policy on profiles.
