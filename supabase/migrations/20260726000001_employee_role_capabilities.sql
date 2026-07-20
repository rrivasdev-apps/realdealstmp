-- Employee Center, piece 1: granular permissions. employee_roles gains
-- capability flags mapping 1:1 to today's three admin-gated areas (Team,
-- Settings, Dashboard/KPI). profiles.role = 'admin' stays a superadmin
-- bypass regardless of these flags; a member with no employee_role (or a
-- role with all flags false) keeps today's default behavior (no elevated
-- access). See can_manage_team/can_manage_settings/can_view_financials
-- below for the actual check.
alter table employee_roles
  add column can_manage_team boolean not null default false,
  add column can_manage_settings boolean not null default false,
  add column can_view_financials boolean not null default false;

-- Three separate functions rather than one parametrized by column name --
-- dynamic-SQL-by-identifier isn't worth the complexity for three small,
-- stable checks. Same shape as the existing is_company_admin/
-- is_company_member.
create function can_manage_team(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join employee_roles on employee_roles.id = profiles.employee_role_id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(employee_roles.can_manage_team, false))
  );
$$;

create function can_manage_settings(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join employee_roles on employee_roles.id = profiles.employee_role_id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(employee_roles.can_manage_settings, false))
  );
$$;

create function can_view_financials(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join employee_roles on employee_roles.id = profiles.employee_role_id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id
      and (profiles.role = 'admin' or coalesce(employee_roles.can_view_financials, false))
  );
$$;

-- Widen commission_types + its two join tables from admin-only to
-- can_manage_settings. Deliberately NOT touching employee_roles' own
-- policies (still is_company_admin below this comment block, untouched) --
-- if a can_manage_settings manager could edit employee_roles, they could
-- grant themselves every capability including can_manage_settings itself,
-- an escalation path straight to admin-equivalent power without ever being
-- role = 'admin'. commission_types and its join tables don't grant any
-- capability, so widening them is safe.
drop policy "Admins can create commission types for their company" on commission_types;
create policy "Managers can create commission types for their company"
  on commission_types for insert with check (can_manage_settings(company_id));
drop policy "Admins can update their company's commission types" on commission_types;
create policy "Managers can update their company's commission types"
  on commission_types for update using (can_manage_settings(company_id));
drop policy "Admins can delete their company's commission types" on commission_types;
create policy "Managers can delete their company's commission types"
  on commission_types for delete using (can_manage_settings(company_id));

drop policy "Admins can assign profile commission types for their company" on profile_commission_types;
create policy "Managers can assign profile commission types for their company"
  on profile_commission_types for insert with check (
    exists (
      select 1 from commission_types
      join profiles on profiles.id = profile_id
      where commission_types.id = commission_type_id
        and profiles.company_id = commission_types.company_id
        and can_manage_settings(commission_types.company_id)
    )
  );
drop policy "Admins can remove profile commission types for their company" on profile_commission_types;
create policy "Managers can remove profile commission types for their company"
  on profile_commission_types for delete using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and can_manage_settings(commission_types.company_id)
    )
  );

drop policy "Admins can assign employee role commission types for their company" on employee_role_commission_types;
create policy "Managers can assign employee role commission types for their company"
  on employee_role_commission_types for insert with check (
    exists (
      select 1 from commission_types
      join employee_roles on employee_roles.id = employee_role_id
      where commission_types.id = commission_type_id
        and employee_roles.company_id = commission_types.company_id
        and can_manage_settings(commission_types.company_id)
    )
  );
drop policy "Admins can remove employee role commission types for their company" on employee_role_commission_types;
create policy "Managers can remove employee role commission types for their company"
  on employee_role_commission_types for delete using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and can_manage_settings(commission_types.company_id)
    )
  );
