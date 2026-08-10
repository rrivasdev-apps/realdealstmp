-- Four FKs into profiles were left with no ON DELETE action, so deleting a
-- profile raised a raw FK violation instead of doing something sensible. That
-- made a company with any payroll history undeletable: companies -> profiles
-- cascades, and the cascade then hit payroll_run_entries_profile_id_fkey.
-- Same class of bug 20260730000003 already fixed for automation step
-- assignees, and fixed the same way -- give every reference an explicit
-- intent. Note there is no "remove an employee" feature today (team members
-- can only be PATCHed), so these paths currently only fire on company
-- teardown and auth-user deletion -- but they're what that feature would land
-- on, so the choice per table is the point:

-- Current-state assignment, meaningless without the employee, and not itself
-- a financial record -- the money it produced lives in payments, which
-- survives below. Cascade.
alter table deal_employees
  drop constraint deal_employees_profile_id_fkey,
  add constraint deal_employees_profile_id_fkey
    foreign key (profile_id) references profiles (id) on delete cascade;

-- A draft worksheet line (hours entered pre-finalize), superseded by the
-- payments row finalizing produces. Cascade.
alter table payroll_run_entries
  drop constraint payroll_run_entries_profile_id_fkey,
  add constraint payroll_run_entries_profile_id_fkey
    foreign key (profile_id) references profiles (id) on delete cascade;

-- Attribution only, same as automation_runtime's completed_by/actor columns
-- (20260731000001) which already set null. Set null.
alter table contacts
  drop constraint contacts_created_by_fkey,
  add constraint contacts_created_by_fkey
    foreign key (created_by) references profiles (id) on delete set null;

-- payments is the one that must NOT cascade. These rows are financial
-- history: 20260801000013 refuses to delete a 'paid' commission row even at
-- the RLS layer, and deals.total_commissions is a live rollup of them
-- (20260805000001) feeding the profit cascade. Cascading here would let
-- deleting an ex-employee silently rewrite the net profit of deals that
-- closed years earlier. Set null keeps the amount, the deal, and therefore
-- the rollup intact -- only "who it was for" is lost, which is the part that
-- genuinely no longer exists.
alter table payments
  drop constraint payments_profile_id_fkey,
  add constraint payments_profile_id_fkey
    foreign key (profile_id) references profiles (id) on delete set null;

-- ...which the commission check constraint has to tolerate, since it required
-- profile_id on every commission row. deal_id/commission_type_id stay
-- required; profile_id is now "required at write time, nullable afterward if
-- that employee is deleted". The app-side guarantee is unchanged --
-- syncCommissionPaymentsForDeal always sets it (src/lib/deals/commissions.ts)
-- -- this only stops a delete elsewhere from tripping over the constraint.
alter table payments
  drop constraint payments_commission_fields_required,
  add constraint payments_commission_fields_required check (
    type <> 'commission' or (deal_id is not null and commission_type_id is not null)
  );
