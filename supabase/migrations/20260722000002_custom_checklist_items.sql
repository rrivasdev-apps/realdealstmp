-- Company-added custom checklist items, on top of the known ~14 built into
-- deals directly (see previous migration). Boolean-only -- there's no way to
-- predefine what fields a never-before-imagined item needs, per Rafael.
-- Same shape as markets/deal_types: company-scoped, no Settings UI
-- restriction beyond that (any member can add one, matching those tables'
-- existing policy -- this isn't sensitive config the way commission_types is).
create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index checklist_items_company_id_idx on checklist_items (company_id);

alter table checklist_items enable row level security;

create policy "Members can read their company's checklist items"
  on checklist_items for select using (is_company_member(company_id));
create policy "Members can create checklist items for their company"
  on checklist_items for insert with check (is_company_member(company_id));

-- Existence = checked, same pattern as contact_contact_types -- no separate
-- boolean column, just whether the row exists.
create table deal_checklist_items (
  deal_id uuid not null references deals (id) on delete cascade,
  checklist_item_id uuid not null references checklist_items (id) on delete cascade,
  primary key (deal_id, checklist_item_id)
);

alter table deal_checklist_items enable row level security;

create policy "Members can read checklist status for their company's deals"
  on deal_checklist_items for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can check checklist items for their company's deals"
  on deal_checklist_items for insert with check (
    exists (
      select 1 from deals
      join checklist_items on checklist_items.id = checklist_item_id
      where deals.id = deal_id
        and checklist_items.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can uncheck checklist items for their company's deals"
  on deal_checklist_items for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
