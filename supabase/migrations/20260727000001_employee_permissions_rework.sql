-- Employee Center, piece 4a: multiple roles per employee + a permission
-- "snapshot" model. Two changes bundled together since they're interdependent
-- (Rafael's reference docs for the original app's Employee Center):
--
-- 1. An employee can now hold more than one employee_role (the reference
--    screens showed an employee with both "Administration" and
--    "App Administrator"). profiles.employee_role_id (a single nullable FK)
--    is replaced by profile_employee_roles, a many-to-many join table --
--    same shape as the existing profile_commission_types/
--    employee_role_commission_types.
--
-- 2. Per Rafael: a role's capability flags are a *template*. Assigning a
--    role to an employee copies (pushes down) that template onto the
--    employee's own permission record. Editing an employee's own record
--    directly overrides it, independent of their role, from then on.
--    Editing a role's template later re-cascades to every employee
--    currently assigned that role -- the app layer warns "N employees will
--    be updated" before doing so (src/app/api/employee-roles/[id]/route.ts).
--    profile_permissions is that per-employee snapshot: the thing actually
--    checked at request time. can_manage_team/can_manage_settings/
--    can_view_financials below now read this table directly -- no join to
--    employee_roles at all, so every ordinary permission check stays a flat
--    single-table lookup; all the "which roles resolve to what" complexity
--    lives in the (rare) write paths instead
--    (src/lib/employee-permissions/recompute.ts).
--
-- profile_permissions is only ever written via the service-role client
-- (recomputeProfilePermissions, or the future direct per-employee override
-- route) -- same posture as profiles.pay_type/employee_role_id writes today
-- -- so it gets a select policy only, no insert/update/delete policy.

create table profile_employee_roles (
  profile_id uuid not null references profiles (id) on delete cascade,
  employee_role_id uuid not null references employee_roles (id) on delete cascade,
  primary key (profile_id, employee_role_id)
);

alter table profile_employee_roles enable row level security;

create policy "Members can read their company's profile employee roles"
  on profile_employee_roles for select using (
    exists (
      select 1 from employee_roles
      where employee_roles.id = employee_role_id and is_company_member(employee_roles.company_id)
    )
  );
-- Ties both FKs to the same tenant -- same cross-tenant-leak guard as
-- profile_commission_types' insert policy. Columns qualified with the
-- table name throughout (not just where ambiguous) since profiles still
-- has its own employee_role_id column at this point in the migration,
-- until it's dropped below -- an unqualified employee_role_id here would
-- silently bind to the wrong one.
create policy "Managers can assign profile employee roles for their company"
  on profile_employee_roles for insert with check (
    exists (
      select 1 from employee_roles
      join profiles on profiles.id = profile_employee_roles.profile_id
      where employee_roles.id = profile_employee_roles.employee_role_id
        and profiles.company_id = employee_roles.company_id
        and can_manage_team(employee_roles.company_id)
    )
  );
create policy "Managers can remove profile employee roles for their company"
  on profile_employee_roles for delete using (
    exists (
      select 1 from employee_roles
      where employee_roles.id = employee_role_id and can_manage_team(employee_roles.company_id)
    )
  );

-- Migrate existing single-role assignments before dropping the column.
insert into profile_employee_roles (profile_id, employee_role_id)
select id, employee_role_id from profiles where employee_role_id is not null;

alter table profiles drop column employee_role_id;

create table profile_permissions (
  profile_id uuid primary key references profiles (id) on delete cascade,
  can_manage_team boolean not null default false,
  can_manage_settings boolean not null default false,
  can_view_financials boolean not null default false
);

alter table profile_permissions enable row level security;

create policy "Members can read their own permissions, managers read their company's"
  on profile_permissions for select using (
    profile_id = auth.uid()
    or exists (
      select 1 from profiles
      where profiles.id = profile_permissions.profile_id and can_manage_team(profiles.company_id)
    )
  );

-- Backfill: every existing profile's snapshot = the OR-union of whichever
-- role(s) they were just migrated onto above (all false if none) -- so
-- nobody's access changes the moment this migration lands.
insert into profile_permissions (profile_id, can_manage_team, can_manage_settings, can_view_financials)
select
  profiles.id,
  coalesce(bool_or(employee_roles.can_manage_team), false),
  coalesce(bool_or(employee_roles.can_manage_settings), false),
  coalesce(bool_or(employee_roles.can_view_financials), false)
from profiles
left join profile_employee_roles on profile_employee_roles.profile_id = profiles.id
left join employee_roles on employee_roles.id = profile_employee_roles.employee_role_id
group by profiles.id;

-- Capability checks now read the per-employee snapshot directly instead of
-- joining through employee_roles -- profile_permissions already holds the
-- resolved value, kept current by recomputeProfilePermissions().
create or replace function can_manage_team(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_manage_team, false))
  );
$$;

create or replace function can_manage_settings(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_manage_settings, false))
  );
$$;

create or replace function can_view_financials(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_view_financials, false))
  );
$$;
