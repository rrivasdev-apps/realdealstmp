-- Traces a payroll payment back to the run that generated it, and lets
-- finalizeRun() (src/lib/payroll/finalize-run.ts) check whether it already
-- inserted payments for this run before doing so again -- needed because a
-- prior bug (see 20260726000005) let finalize partially complete (payments
-- inserted, entries computed) without the run flipping to 'finalized',
-- which would have caused a naive retry to double-pay. Null for manual
-- payroll entries and all commission payments.
alter table payments
  add column payroll_run_id uuid references payroll_runs (id) on delete set null;

create index payments_payroll_run_id_idx on payments (payroll_run_id);
