-- Payments -- built for commissions now, but kept extensible (a `type`
-- column) per Rafael, since vendor payments/payroll will likely reuse this
-- table later rather than getting their own ad-hoc one.
--
-- status: 'created' (basis not known yet -- gross_profit/current_selling_price
-- commissions before the deal is closed & funded), 'pending' (calculable,
-- amount is current, awaiting payment), 'paid' (no UI marks this yet, but
-- the column exists so it isn't a breaking migration later).
--
-- Has its own company_id (not purely deal-scoped) since not every future
-- payment type will be tied to a deal -- but for commission-type rows,
-- deal_id/profile_id/commission_type_id are all required.
create table payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  type text not null default 'commission',
  deal_id uuid references deals (id) on delete cascade,
  profile_id uuid references profiles (id),
  commission_type_id uuid references commission_types (id),
  amount numeric,
  status text not null check (status in ('created', 'pending', 'paid')),
  created_at timestamptz not null default now(),
  constraint payments_commission_fields_required check (
    type <> 'commission' or (deal_id is not null and profile_id is not null and commission_type_id is not null)
  )
);

create index payments_company_id_idx on payments (company_id);
create index payments_deal_id_idx on payments (deal_id);

alter table payments enable row level security;

create policy "Members can read their company's payments"
  on payments for select using (is_company_member(company_id));
-- Ties deal_id/profile_id to the same tenant as company_id -- same
-- reasoning as deal_employees/commission-type assignment policies.
create policy "Members can create payments for their company"
  on payments for insert with check (
    is_company_member(company_id)
    and (deal_id is null or exists (select 1 from deals where deals.id = deal_id and deals.company_id = payments.company_id))
    and (profile_id is null or exists (select 1 from profiles where profiles.id = payments.profile_id and profiles.company_id = payments.company_id))
  );
create policy "Members can update their company's payments"
  on payments for update using (is_company_member(company_id));
