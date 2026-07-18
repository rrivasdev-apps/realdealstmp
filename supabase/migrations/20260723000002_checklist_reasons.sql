-- Three separate company-configurable reason lists (On Hold, Cancelled-AB,
-- Cancelled-BC/AC) -- kept distinct per Rafael, since the reasons a deal
-- goes on hold aren't the same pool as why a side cancelled. Same shape as
-- checklist_items: any member can add one (not admin-gated -- these aren't
-- sensitive config), managed in Settings.
create table on_hold_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table cancelled_ab_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table cancelled_bc_ac_reasons (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index on_hold_reasons_company_id_idx on on_hold_reasons (company_id);
create index cancelled_ab_reasons_company_id_idx on cancelled_ab_reasons (company_id);
create index cancelled_bc_ac_reasons_company_id_idx on cancelled_bc_ac_reasons (company_id);

alter table on_hold_reasons enable row level security;
alter table cancelled_ab_reasons enable row level security;
alter table cancelled_bc_ac_reasons enable row level security;

create policy "Members can read their company's on hold reasons"
  on on_hold_reasons for select using (is_company_member(company_id));
create policy "Members can create on hold reasons for their company"
  on on_hold_reasons for insert with check (is_company_member(company_id));

create policy "Members can read their company's cancelled AB reasons"
  on cancelled_ab_reasons for select using (is_company_member(company_id));
create policy "Members can create cancelled AB reasons for their company"
  on cancelled_ab_reasons for insert with check (is_company_member(company_id));

create policy "Members can read their company's cancelled BC AC reasons"
  on cancelled_bc_ac_reasons for select using (is_company_member(company_id));
create policy "Members can create cancelled BC AC reasons for their company"
  on cancelled_bc_ac_reasons for insert with check (is_company_member(company_id));

-- Multi-select join tables -- existence = selected, same pattern as
-- deal_checklist_items/contact_contact_types.
create table deal_on_hold_reasons (
  deal_id uuid not null references deals (id) on delete cascade,
  on_hold_reason_id uuid not null references on_hold_reasons (id) on delete cascade,
  primary key (deal_id, on_hold_reason_id)
);

create table deal_cancelled_ab_reasons (
  deal_id uuid not null references deals (id) on delete cascade,
  cancelled_ab_reason_id uuid not null references cancelled_ab_reasons (id) on delete cascade,
  primary key (deal_id, cancelled_ab_reason_id)
);

create table deal_cancelled_bc_ac_reasons (
  deal_id uuid not null references deals (id) on delete cascade,
  cancelled_bc_ac_reason_id uuid not null references cancelled_bc_ac_reasons (id) on delete cascade,
  primary key (deal_id, cancelled_bc_ac_reason_id)
);

alter table deal_on_hold_reasons enable row level security;
alter table deal_cancelled_ab_reasons enable row level security;
alter table deal_cancelled_bc_ac_reasons enable row level security;

create policy "Members can read on hold reasons for their company's deals"
  on deal_on_hold_reasons for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can select on hold reasons for their company's deals"
  on deal_on_hold_reasons for insert with check (
    exists (
      select 1 from deals
      join on_hold_reasons on on_hold_reasons.id = on_hold_reason_id
      where deals.id = deal_id
        and on_hold_reasons.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can unselect on hold reasons for their company's deals"
  on deal_on_hold_reasons for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );

create policy "Members can read cancelled AB reasons for their company's deals"
  on deal_cancelled_ab_reasons for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can select cancelled AB reasons for their company's deals"
  on deal_cancelled_ab_reasons for insert with check (
    exists (
      select 1 from deals
      join cancelled_ab_reasons on cancelled_ab_reasons.id = cancelled_ab_reason_id
      where deals.id = deal_id
        and cancelled_ab_reasons.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can unselect cancelled AB reasons for their company's deals"
  on deal_cancelled_ab_reasons for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );

create policy "Members can read cancelled BC AC reasons for their company's deals"
  on deal_cancelled_bc_ac_reasons for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can select cancelled BC AC reasons for their company's deals"
  on deal_cancelled_bc_ac_reasons for insert with check (
    exists (
      select 1 from deals
      join cancelled_bc_ac_reasons on cancelled_bc_ac_reasons.id = cancelled_bc_ac_reason_id
      where deals.id = deal_id
        and cancelled_bc_ac_reasons.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can unselect cancelled BC AC reasons for their company's deals"
  on deal_cancelled_bc_ac_reasons for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
