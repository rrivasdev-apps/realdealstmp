-- Employee Center, piece 4b: expand the capability-flag set beyond
-- Team/Settings/Dashboard-financials to cover the real pages/actions Rafael's
-- reference docs called out (RealDeal features group). Two categories:
--
-- Base-access flags (view_whiteboard, view_deal_detail, edit_deal_detail,
-- view_contacts, edit_contacts) default true on both employee_roles
-- (template) and profile_permissions (actual) -- Postgres fills existing
-- rows with the literal default on ALTER TABLE ADD COLUMN, so every
-- existing employee keeps today's "any company member can see/edit these
-- pages" behavior on deploy day. Turning one off for a role/employee going
-- forward is the new behavior these flags exist for.
--
-- can_manage_payroll splits payroll processing out of can_manage_team,
-- matching the reference's distinct "Manager Functionalities" grouping --
-- added with default false, then backfilled to match each row's current
-- can_manage_team value so nobody's payroll access changes either.

alter table employee_roles
  add column view_whiteboard boolean not null default true,
  add column view_deal_detail boolean not null default true,
  add column edit_deal_detail boolean not null default true,
  add column view_contacts boolean not null default true,
  add column edit_contacts boolean not null default true,
  add column can_manage_payroll boolean not null default false;

update employee_roles set can_manage_payroll = can_manage_team;

alter table profile_permissions
  add column view_whiteboard boolean not null default true,
  add column view_deal_detail boolean not null default true,
  add column edit_deal_detail boolean not null default true,
  add column view_contacts boolean not null default true,
  add column edit_contacts boolean not null default true,
  add column can_manage_payroll boolean not null default false;

update profile_permissions set can_manage_payroll = can_manage_team;

-- recomputeProfilePermissions (src/lib/employee-permissions/recompute.ts)
-- ORs these same six columns across every assigned role -- no SQL change
-- needed there, it already reads whichever columns exist on both tables.

create function can_manage_payroll(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.can_manage_payroll, false))
  );
$$;

create function view_whiteboard(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_whiteboard, false))
  );
$$;

create function view_deal_detail(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_deal_detail, false))
  );
$$;

create function edit_deal_detail(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.edit_deal_detail, false))
  );
$$;

create function view_contacts(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.view_contacts, false))
  );
$$;

create function edit_contacts(target_company_id uuid)
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
      and (profiles.role = 'admin' or coalesce(profile_permissions.edit_contacts, false))
  );
$$;

-- Payroll RLS moves from can_manage_team to the new, split-out can_manage_payroll.
drop policy "Members can read payroll payments they're entitled to" on payments;
create policy "Members can read payroll payments they're entitled to"
  on payments for select using (
    type = 'payroll' and is_company_member(company_id)
    and (profile_id = auth.uid() or can_manage_payroll(company_id))
  );
drop policy "Managers can create payroll payments for their company" on payments;
create policy "Managers can create payroll payments for their company"
  on payments for insert with check (
    type = 'payroll' and can_manage_payroll(company_id)
    and exists (select 1 from profiles where profiles.id = payments.profile_id and profiles.company_id = payments.company_id)
  );

drop policy "Managers can read their company's payroll runs" on payroll_runs;
create policy "Managers can read their company's payroll runs"
  on payroll_runs for select using (can_manage_payroll(company_id));
drop policy "Managers can create payroll runs for their company" on payroll_runs;
create policy "Managers can create payroll runs for their company"
  on payroll_runs for insert with check (can_manage_payroll(company_id));
drop policy "Managers can update draft payroll runs for their company" on payroll_runs;
create policy "Managers can update draft payroll runs for their company"
  on payroll_runs for update
  using (can_manage_payroll(company_id) and status = 'draft')
  with check (can_manage_payroll(company_id));

drop policy "Managers can read their company's payroll run entries" on payroll_run_entries;
create policy "Managers can read their company's payroll run entries"
  on payroll_run_entries for select using (
    exists (select 1 from payroll_runs where payroll_runs.id = payroll_run_id and can_manage_payroll(payroll_runs.company_id))
  );
drop policy "Managers can create payroll run entries for their company" on payroll_run_entries;
create policy "Managers can create payroll run entries for their company"
  on payroll_run_entries for insert with check (
    exists (select 1 from payroll_runs where payroll_runs.id = payroll_run_id and can_manage_payroll(payroll_runs.company_id))
  );
drop policy "Managers can update entries on draft payroll runs" on payroll_run_entries;
create policy "Managers can update entries on draft payroll runs"
  on payroll_run_entries for update using (
    exists (
      select 1 from payroll_runs
      where payroll_runs.id = payroll_run_id and can_manage_payroll(payroll_runs.company_id) and payroll_runs.status = 'draft'
    )
  );

-- Deals/contacts RLS: defense in depth under the app-layer requirePermission
-- checks (src/app/api/deals/**, src/app/api/contacts/**), same posture as
-- commission_types/payroll above. SELECT stays permissive to either the
-- list-view or detail-view flag, since RLS can't distinguish which page is
-- asking -- the view_whiteboard/view_deal_detail split is meaningful at the
-- app layer (which page renders), not at the row-visibility layer.
drop policy "Members can read their company's deals" on deals;
create policy "Members can read their company's deals"
  on deals for select using (view_whiteboard(company_id) or view_deal_detail(company_id));
drop policy "Members can create deals for their company" on deals;
create policy "Members can create deals for their company"
  on deals for insert with check (edit_deal_detail(company_id));
drop policy "Members can update their company's deals" on deals;
create policy "Members can update their company's deals"
  on deals for update using (edit_deal_detail(company_id));

drop policy "Members can read their company's contacts" on contacts;
create policy "Members can read their company's contacts"
  on contacts for select using (view_contacts(company_id));
drop policy "Members can create contacts for their company" on contacts;
create policy "Members can create contacts for their company"
  on contacts for insert with check (edit_contacts(company_id));
drop policy "Members can update their company's contacts" on contacts;
create policy "Members can update their company's contacts"
  on contacts for update using (edit_contacts(company_id));
