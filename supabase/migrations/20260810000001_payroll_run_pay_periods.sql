-- Pay periods finally drive payroll runs, closing the follow-up deliberately
-- deferred by 20260728000001_pay_period_details.sql: next_payday was seeded at
-- creation and then only ever moved by hand, because runs had no link back to
-- the schedule that produced them.
--
-- Nullable, and stays nullable: ad-hoc runs (explicit start/end dates, no named
-- schedule) are still supported and are all that existing rows are. `on delete
-- set null` rather than cascade -- deleting a schedule definition must not take
-- finalized payroll history with it; the run keeps its own start/end dates,
-- which is what payments were actually issued against.
alter table payroll_runs
  add column pay_period_id uuid references pay_periods (id) on delete set null;

create index payroll_runs_pay_period_id_idx on payroll_runs (pay_period_id);

-- next_payday advancement on finalize (src/lib/payroll/finalize-run.ts) writes
-- pay_periods through the finalizing user's client, which the existing
-- "Members can update their company's pay periods" policy from
-- 20260728000001 already covers -- no new policy needed here.
