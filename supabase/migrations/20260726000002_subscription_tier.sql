-- Employee Center, piece 2: a manually-set subscription tier gate. No
-- billing integration yet (no Stripe, no upgrade flow) -- this is just the
-- gate that a future billing feature can hook into. For now it's only set
-- via SQL/service-role. Full payroll runs (see the payroll_runs migration)
-- are the only feature gated on this so far.
alter table companies
  add column subscription_tier text not null default 'standard'
    check (subscription_tier in ('standard', 'employee_center'));
