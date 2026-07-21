-- Employee Center, piece 4d: "Pay Periods" from Rafael's reference --
-- company-defined labels ("Weekly Salary", "Monthly Commissions", etc.), not
-- a fixed enum, so this is a company-scoped lookup exactly like
-- markets/deal_types/lead_sources, multi-select per employee (an employee
-- can be tagged with more than one).
create table pay_periods (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index pay_periods_company_id_idx on pay_periods (company_id);

alter table pay_periods enable row level security;

create policy "Members can read their company's pay periods"
  on pay_periods for select using (is_company_member(company_id));
create policy "Members can create pay periods for their company"
  on pay_periods for insert with check (is_company_member(company_id));

-- Join table -- same shape as profile_commission_types (no company_id of its
-- own, scoped through pay_period_id's company).
create table profile_pay_periods (
  profile_id uuid not null references profiles (id) on delete cascade,
  pay_period_id uuid not null references pay_periods (id) on delete cascade,
  primary key (profile_id, pay_period_id)
);

alter table profile_pay_periods enable row level security;

create policy "Members can read their company's profile pay periods"
  on profile_pay_periods for select using (
    exists (
      select 1 from pay_periods
      where pay_periods.id = pay_period_id and is_company_member(pay_periods.company_id)
    )
  );
create policy "Managers can assign profile pay periods for their company"
  on profile_pay_periods for insert with check (
    exists (
      select 1 from pay_periods
      join profiles on profiles.id = profile_id
      where pay_periods.id = pay_period_id
        and profiles.company_id = pay_periods.company_id
        and can_manage_team(pay_periods.company_id)
    )
  );
create policy "Managers can remove profile pay periods for their company"
  on profile_pay_periods for delete using (
    exists (
      select 1 from pay_periods
      where pay_periods.id = pay_period_id and can_manage_team(pay_periods.company_id)
    )
  );
