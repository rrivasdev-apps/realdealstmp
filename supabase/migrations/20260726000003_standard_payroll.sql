-- Employee Center, piece 3: standard-tier payroll (available to every
-- company, not just the employee_center subscription tier). Per-employee
-- pay rate + a manual "record a payroll payment" entry, reusing `payments`
-- (it was designed for exactly this -- see its own migration's comment).
alter table profiles
  add column pay_type text check (pay_type in ('hourly', 'salary')),
  add column pay_rate numeric;

alter table payments
  add column pay_period_start date,
  add column pay_period_end date;

-- `type` had no check constraint at all until now (only a default).
alter table payments
  add constraint payments_type_check check (type in ('commission', 'payroll')),
  add constraint payments_payroll_fields_required check (
    type <> 'payroll' or (profile_id is not null and pay_period_start is not null and pay_period_end is not null)
  ),
  -- Payroll rows are always a record of money already paid -- there's no
  -- pending/created workflow for payroll the way there is for commissions
  -- (which can be created before a deal's numbers are known).
  add constraint payments_payroll_status_check check (type <> 'payroll' or status = 'paid');

-- Split the previously-broad is_company_member policies by type. Commission
-- rows keep today's exact behavior (unchanged below). Payroll rows are
-- compensation data -- narrower on purpose: an employee can see their own,
-- can_manage_team can see everyone's; only can_manage_team can create one;
-- and there is deliberately NO update policy for type='payroll' (a wrong
-- entry gets corrected with a new row, not an edit -- immutable by RLS
-- default-deny, no trigger needed, same outcome as
-- protect_original_deal_values achieves for deals).
drop policy "Members can read their company's payments" on payments;
drop policy "Members can create payments for their company" on payments;
drop policy "Members can update their company's payments" on payments;

create policy "Members can read their company's commission payments"
  on payments for select using (type = 'commission' and is_company_member(company_id));
create policy "Members can read payroll payments they're entitled to"
  on payments for select using (
    type = 'payroll'
    and is_company_member(company_id)
    and (profile_id = auth.uid() or can_manage_team(company_id))
  );

create policy "Members can create commission payments for their company"
  on payments for insert with check (
    type = 'commission'
    and is_company_member(company_id)
    and (deal_id is null or exists (select 1 from deals where deals.id = deal_id and deals.company_id = payments.company_id))
    and (profile_id is null or exists (select 1 from profiles where profiles.id = payments.profile_id and profiles.company_id = payments.company_id))
  );
create policy "Managers can create payroll payments for their company"
  on payments for insert with check (
    type = 'payroll'
    and can_manage_team(company_id)
    and exists (select 1 from profiles where profiles.id = payments.profile_id and profiles.company_id = payments.company_id)
  );

create policy "Members can update their company's commission payments"
  on payments for update using (type = 'commission' and is_company_member(company_id));
