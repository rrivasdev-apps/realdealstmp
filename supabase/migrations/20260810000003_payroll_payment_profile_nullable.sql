-- Completes 20260810000002, which switched payments.profile_id to ON DELETE
-- SET NULL but only relaxed the *commission* check constraint. Payroll rows
-- carry the identical `profile_id is not null` requirement, so deleting an
-- employee who had ever been paid through a payroll run still failed -- the
-- set-null fired and immediately tripped this constraint instead.
--
-- Same reasoning as the commission side: a paid payroll row is money that
-- already left the account (20260726000003 pins payroll rows to status
-- 'paid' precisely because they're a record, not a workflow), so it has to
-- outlive the employee it was paid to. pay_period_start/end stay required --
-- they're facts about the payment itself, not a reference that can rot.
alter table payments
  drop constraint payments_payroll_fields_required,
  add constraint payments_payroll_fields_required check (
    type <> 'payroll' or (pay_period_start is not null and pay_period_end is not null)
  );
