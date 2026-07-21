-- Pay Periods, richer version: per Rafael's reference
-- (docs/reference/payroll-periods.md), a pay period is a real payroll
-- schedule definition, not just a name. All new columns nullable -- existing
-- rows (name-only, shipped last week) can't retroactively have a payment
-- type; enforced as required in the create/edit form for new/edited rows
-- instead, same convention as profiles.employee_type.
--
-- next_payday is meant to auto-advance each time payroll actually runs
-- against this period, per the reference -- that integration with
-- payroll_runs/finalize-run.ts is a deliberate follow-up, not built in this
-- pass (see the memory note this doc was saved with). For now next_payday
-- is just seeded from first_payday at creation and admin-editable after.
alter table pay_periods
  add column payment_type text check (payment_type in ('salary', 'commission', 'combined')),
  add column salary_pay_frequency text check (salary_pay_frequency in ('weekly', 'biweekly', 'once_a_month', 'twice_a_month')),
  add column salary_type text check (salary_type in ('fixed', 'hourly')),
  add column commission_pay_frequency text check (
    commission_pay_frequency in ('weekly', 'biweekly', 'once_a_month', 'twice_a_month', 'quarterly', 'immediately_on_closing')
  ),
  add column first_payday date,
  add column next_payday date,
  add column comments text,
  add constraint pay_periods_salary_fields_required check (
    payment_type not in ('salary', 'combined') or (salary_pay_frequency is not null and salary_type is not null)
  ),
  add constraint pay_periods_commission_field_required check (
    payment_type not in ('commission', 'combined') or commission_pay_frequency is not null
  );

-- No update policy existed yet (pay_periods only supported create, matching
-- markets/deal_types/lead_sources) -- now needed since the richer form
-- supports editing. Same permissiveness as insert: any company member, not
-- admin-gated at the RLS layer (the Settings page itself is the real gate).
create policy "Members can update their company's pay periods"
  on pay_periods for update using (is_company_member(company_id));
