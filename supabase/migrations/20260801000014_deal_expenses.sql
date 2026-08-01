-- Itemized deal expenses -- the "later pass" flagged in
-- 20260720000001_deal_expenses_commissions.sql's comment (deals.total_expenses
-- was kept as a flat manual total there, with itemized line items deferred
-- until a spec for that UI showed up). Per Rafael: expenses should be
-- entered as a list of categorized line items against the deal, not one
-- number.
--
-- Categories are company-scoped, same shape/policies as
-- markets/deal_types/lead_sources -- seeded with generic wholesale/flip
-- defaults at signup, editable in Settings.
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null
);

create index expense_categories_company_id_idx on expense_categories (company_id);

alter table expense_categories enable row level security;

create policy "Members can read their company's expense categories"
  on expense_categories for select using (is_company_member(company_id));
create policy "Members can create expense categories for their company"
  on expense_categories for insert with check (is_company_member(company_id));

-- Deal-scoped only, no company_id of its own -- same pattern as
-- deal_employees/offers/showings, scoped through the parent deal.
create table deal_expenses (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  category_id uuid not null references expense_categories (id),
  description text,
  amount numeric not null,
  expense_date date,
  created_at timestamptz not null default now()
);

create index deal_expenses_deal_id_idx on deal_expenses (deal_id);

alter table deal_expenses enable row level security;

create policy "Members can read deal expenses for their company's deals"
  on deal_expenses for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can add deal expenses for their company's deals"
  on deal_expenses for insert with check (
    exists (
      select 1 from deals
      join expense_categories on expense_categories.id = category_id
      where deals.id = deal_id
        and expense_categories.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can update deal expenses for their company's deals"
  on deal_expenses for update using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  )
  with check (
    exists (
      select 1 from deals
      join expense_categories on expense_categories.id = category_id
      where deals.id = deal_id
        and expense_categories.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can remove deal expenses for their company's deals"
  on deal_expenses for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );

-- deals.total_expenses stays the field the profit cascade / KPI reporting /
-- field_changed automations already read (see
-- 20260720000001_deal_expenses_commissions.sql, src/lib/deals/profit.ts,
-- src/lib/deals/kpi.ts) -- now a generated rollup of this table instead of a
-- manually-entered figure, so nothing downstream has to change.
create or replace function sync_deal_total_expenses()
returns trigger
language plpgsql
as $$
declare
  target_deal_id uuid := coalesce(new.deal_id, old.deal_id);
begin
  update deals
  set total_expenses = (select coalesce(sum(amount), 0) from deal_expenses where deal_id = target_deal_id)
  where id = target_deal_id;
  return null;
end;
$$;

create trigger deal_expenses_sync_total
  after insert or update or delete on deal_expenses
  for each row execute function sync_deal_total_expenses();
