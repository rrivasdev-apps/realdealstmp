-- Minimal deal_employees slice (Phase 2's deal_employee_roles/TC-Closer
-- tracking is deliberately left out -- not needed for the commission engine,
-- which keys off the employee's org-wide employee_role instead). Adding a
-- row here is the trigger event: the commission engine calculates payments
-- for this profile as soon as it's inserted (see /api/deals/[id]/employees).
create table deal_employees (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references deals (id) on delete cascade,
  profile_id uuid not null references profiles (id),
  created_at timestamptz not null default now(),
  unique (deal_id, profile_id)
);

create index deal_employees_deal_id_idx on deal_employees (deal_id);

alter table deal_employees enable row level security;

-- No company_id of its own -- scoped through the parent deal, same pattern
-- as offers/showings. Also ties profile_id to the same tenant as the deal,
-- same reasoning as the commission-type assignment policies.
create policy "Members can read deal employees for their company's deals"
  on deal_employees for select using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
create policy "Members can add deal employees for their company's deals"
  on deal_employees for insert with check (
    exists (
      select 1 from deals
      join profiles on profiles.id = profile_id
      where deals.id = deal_id
        and profiles.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can remove deal employees for their company's deals"
  on deal_employees for delete using (
    exists (select 1 from deals where deals.id = deal_id and is_company_member(deals.company_id))
  );
