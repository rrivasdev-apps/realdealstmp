-- Employees are never hard-deleted, per Rafael: "deleting" an employee hides
-- them from the Team list and revokes their access, but the row and every
-- payment, commission and deal assignment attached to it stay exactly as they
-- were. A separate "Deleted" view lists them and can restore them. This is
-- the opposite of 20260810000002's hard-delete semantics -- those ON DELETE
-- actions stay as the correct behaviour for the day a row genuinely is
-- destroyed (company teardown), but they are no longer a path the UI offers.
alter table profiles
  add column deleted_at timestamptz;

-- Partial index: every list in the app filters to active employees, and this
-- keeps that the cheap path as a company accumulates former staff.
create index profiles_company_id_active_idx on profiles (company_id) where deleted_at is null;

-- Same shape as the role/company guard this extends (20260728000002): the
-- pin only applies when the row's owner is updating themselves, so the
-- service-role client behind /api/team/[id]/status can still set it. Without
-- this, a deleted employee could clear their own flag through the Supabase
-- API and restore their own access -- the self-update RLS policy allows
-- writing any other column of your own row.
create or replace function protect_profile_role_and_company()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id then
    new.company_id := old.company_id;
    new.role := old.role;
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

-- Every helper that resolves the *caller's* profile now requires that caller
-- to be active. Redefined together because they're one rule, not eleven:
-- a deleted employee holding a still-valid access token passes no
-- company-scoped policy in the database, whatever the application layer does.
-- (These check the caller, never the target row -- an active manager can
-- still read and restore a deleted teammate's profile.)
create or replace function is_company_member(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and company_id = target_company_id and deleted_at is null
  );
$$;

create or replace function is_company_admin(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and company_id = target_company_id and role = 'admin' and deleted_at is null
  );
$$;

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
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
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
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
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
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_view_financials, false))
  );
$$;

create or replace function can_manage_payroll(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_manage_payroll, false))
  );
$$;

create or replace function view_whiteboard(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_whiteboard, false))
  );
$$;

create or replace function view_deal_detail(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_deal_detail, false))
  );
$$;

create or replace function edit_deal_detail(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.edit_deal_detail, false))
  );
$$;

create or replace function view_contacts(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_contacts, false))
  );
$$;

create or replace function edit_contacts(target_company_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from profiles
    left join profile_permissions on profile_permissions.profile_id = profiles.id
    where profiles.id = auth.uid() and profiles.company_id = target_company_id and profiles.deleted_at is null
      and (profiles.role = 'admin' or coalesce(profile_permissions.edit_contacts, false))
  );
$$;
