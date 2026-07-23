-- Reasons for selling, per docs/data-model.md's `selling_reasons` /
-- `deal_selling_reasons` entry -- documented alongside on_hold/cancelled
-- reasons but never actually built. Same shape: company-configurable lookup
-- (any member can add, matching on_hold_reasons/cancelled_ab_reasons) plus a
-- multi-select join table (existence = selected).
create table selling_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index selling_reasons_company_id_idx on selling_reasons (company_id);

alter table selling_reasons enable row level security;

create policy "Members can read their company's selling reasons"
  on selling_reasons for select using (is_company_member(company_id));
create policy "Members can create selling reasons for their company"
  on selling_reasons for insert with check (is_company_member(company_id));

create table deal_selling_reasons (
  deal_id uuid not null references deals (id) on delete cascade,
  selling_reason_id uuid not null references selling_reasons (id) on delete cascade,
  primary key (deal_id, selling_reason_id)
);

alter table deal_selling_reasons enable row level security;

create policy "Members can read selling reasons for their company's deals"
  on deal_selling_reasons for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can select selling reasons for their company's deals"
  on deal_selling_reasons for insert with check (
    exists (
      select 1 from deals
      join selling_reasons on selling_reasons.id = selling_reason_id
      where deals.id = deal_id
        and selling_reasons.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can unselect selling reasons for their company's deals"
  on deal_selling_reasons for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
