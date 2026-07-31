-- payments had no delete policy at all (20260726000003_standard_payroll.sql
-- deliberately keeps payroll rows immutable). Commission rows now need one:
-- removing an employee from a deal, or changing which role(s) they play on
-- it, reverts any commission payment that's no longer earned -- but only if
-- it hasn't been paid yet (see removeCommissionPaymentsForDealEmployee /
-- syncCommissionPaymentsForDealEmployeeRoles in src/lib/deals/commissions.ts,
-- which already refuse the operation app-side if a 'paid' row is affected).
-- The `status <> 'paid'` clause here is a DB-level backstop for that same
-- rule, not a new one -- payroll rows remain untouched (no delete policy
-- for type = 'payroll').
create policy "Members can delete their company's unpaid commission payments"
  on payments for delete using (
    type = 'commission' and status <> 'paid' and is_company_member(company_id)
  );
