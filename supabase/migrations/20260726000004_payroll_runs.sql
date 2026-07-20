-- Employee Center, piece 4: full payroll runs -- employee_center
-- subscription tier only (checked in application code, see /payroll page
-- and its API routes; this schema itself doesn't enforce the tier, same as
-- RLS never being the sole enforcement point elsewhere in this app).
--
-- A run is a draft workspace for a pay period: one entry per employee with
-- pay_type/pay_rate set, hours entered manually for hourly employees (time
-- tracking doesn't exist yet -- this is the seam it'll fill in later).
-- Finalizing computes each entry's amount and inserts one payments row per
-- entry, then locks the run -- see src/lib/payroll/finalize-run.ts.
create table payroll_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  pay_period_start date not null,
  pay_period_end date not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create table payroll_run_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references payroll_runs (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  hours_worked numeric,
  computed_amount numeric
);

create index payroll_runs_company_id_idx on payroll_runs (company_id);
create index payroll_run_entries_payroll_run_id_idx on payroll_run_entries (payroll_run_id);

alter table payroll_runs enable row level security;
alter table payroll_run_entries enable row level security;

create policy "Managers can read their company's payroll runs"
  on payroll_runs for select using (can_manage_team(company_id));
create policy "Managers can create payroll runs for their company"
  on payroll_runs for insert with check (can_manage_team(company_id));
-- Deliberately draft-only -- once finalized, no policy covers the row, so
-- it's uneditable by RLS default-deny (same trick as payroll payments'
-- missing update policy). No delete policy at any status, matching payments.
create policy "Managers can update draft payroll runs for their company"
  on payroll_runs for update using (can_manage_team(company_id) and status = 'draft');

create policy "Managers can read their company's payroll run entries"
  on payroll_run_entries for select using (
    exists (select 1 from payroll_runs where payroll_runs.id = payroll_run_id and can_manage_team(payroll_runs.company_id))
  );
create policy "Managers can create payroll run entries for their company"
  on payroll_run_entries for insert with check (
    exists (select 1 from payroll_runs where payroll_runs.id = payroll_run_id and can_manage_team(payroll_runs.company_id))
  );
create policy "Managers can update entries on draft payroll runs"
  on payroll_run_entries for update using (
    exists (
      select 1 from payroll_runs
      where payroll_runs.id = payroll_run_id and can_manage_team(payroll_runs.company_id) and payroll_runs.status = 'draft'
    )
  );
