-- Which of an employee's org-wide employee_role(s) they're playing on this
-- specific deal (e.g. he's configured as both Closer and TC company-wide,
-- but is only acting as Closer on this deal). One deal_employee row can have
-- several of these -- Rafael confirmed an employee can wear multiple hats on
-- the same deal. The commission engine now scopes role-driven commission
-- types to just the roles selected here, instead of stacking every role the
-- profile holds (see createCommissionPaymentsForDealEmployee).
create table deal_employee_roles (
  id uuid primary key default gen_random_uuid(),
  deal_employee_id uuid not null references deal_employees (id) on delete cascade,
  employee_role_id uuid not null references employee_roles (id),
  created_at timestamptz not null default now(),
  unique (deal_employee_id, employee_role_id)
);

create index deal_employee_roles_deal_employee_id_idx on deal_employee_roles (deal_employee_id);

alter table deal_employee_roles enable row level security;

-- Scoped through deal_employees -> deals, same pattern as deal_employees
-- itself. Insert also confirms the role belongs to the same company as the
-- deal; that the role is actually one of the employee's configured roles is
-- enforced server-side in the API route (POST /api/deals/[id]/employees).
create policy "Members can read deal employee roles for their company's deals"
  on deal_employee_roles for select using (
    exists (
      select 1 from deal_employees
      join deals on deals.id = deal_employees.deal_id
      where deal_employees.id = deal_employee_id and is_company_member(deals.company_id)
    )
  );
create policy "Members can add deal employee roles for their company's deals"
  on deal_employee_roles for insert with check (
    exists (
      select 1 from deal_employees
      join deals on deals.id = deal_employees.deal_id
      join employee_roles on employee_roles.id = employee_role_id
      where deal_employees.id = deal_employee_id
        and employee_roles.company_id = deals.company_id
        and is_company_member(deals.company_id)
    )
  );
create policy "Members can remove deal employee roles for their company's deals"
  on deal_employee_roles for delete using (
    exists (
      select 1 from deal_employees
      join deals on deals.id = deal_employees.deal_id
      where deal_employees.id = deal_employee_id and is_company_member(deals.company_id)
    )
  );
