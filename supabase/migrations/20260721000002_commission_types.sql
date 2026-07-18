-- Company-configurable commission types (Settings > Deal Commissions).
-- category = 'flat' (value is a dollar amount) or 'percentage' (value is a
-- percent, applied against `basis`). basis only matters for 'percentage'
-- and is checked accordingly -- see calculateCommissionAmount in
-- src/lib/deals/commissions.ts for how category/basis combine with a deal's
-- current numbers, and CLAUDE.md's "one shared function" rule for why that
-- logic isn't duplicated in SQL.
create table commission_types (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  name text not null,
  description text,
  category text not null check (category in ('flat', 'percentage')),
  basis text check (basis in ('contract_price', 'gross_profit', 'current_selling_price')),
  value numeric not null,
  created_at timestamptz not null default now(),
  constraint commission_types_basis_required_for_percentage check (
    (category = 'percentage' and basis is not null) or
    (category = 'flat' and basis is null)
  )
);

create index commission_types_company_id_idx on commission_types (company_id);

alter table commission_types enable row level security;

create policy "Members can read their company's commission types"
  on commission_types for select using (is_company_member(company_id));
create policy "Admins can create commission types for their company"
  on commission_types for insert with check (is_company_admin(company_id));
create policy "Admins can update their company's commission types"
  on commission_types for update using (is_company_admin(company_id));
create policy "Admins can delete their company's commission types"
  on commission_types for delete using (is_company_admin(company_id));

-- Two assignment paths, both apply and stack (per Rafael): a commission type
-- can be assigned directly to a profile, and/or to an employee_role (which
-- then applies to every profile with that role). No company_id of their own
-- -- scoped through commission_type_id's company, same pattern as other
-- child tables.
create table profile_commission_types (
  profile_id uuid not null references profiles (id) on delete cascade,
  commission_type_id uuid not null references commission_types (id) on delete cascade,
  primary key (profile_id, commission_type_id)
);

create table employee_role_commission_types (
  employee_role_id uuid not null references employee_roles (id) on delete cascade,
  commission_type_id uuid not null references commission_types (id) on delete cascade,
  primary key (employee_role_id, commission_type_id)
);

alter table profile_commission_types enable row level security;
alter table employee_role_commission_types enable row level security;

create policy "Members can read their company's profile commission types"
  on profile_commission_types for select using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and is_company_member(commission_types.company_id)
    )
  );
-- Ties both FKs to the same tenant -- without this, an admin could assign
-- their own company's commission type to a profile belonging to a different
-- company (nonsensical, but a real cross-tenant leak if left unchecked).
create policy "Admins can assign profile commission types for their company"
  on profile_commission_types for insert with check (
    exists (
      select 1 from commission_types
      join profiles on profiles.id = profile_id
      where commission_types.id = commission_type_id
        and profiles.company_id = commission_types.company_id
        and is_company_admin(commission_types.company_id)
    )
  );
create policy "Admins can remove profile commission types for their company"
  on profile_commission_types for delete using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and is_company_admin(commission_types.company_id)
    )
  );

create policy "Members can read their company's employee role commission types"
  on employee_role_commission_types for select using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and is_company_member(commission_types.company_id)
    )
  );
create policy "Admins can assign employee role commission types for their company"
  on employee_role_commission_types for insert with check (
    exists (
      select 1 from commission_types
      join employee_roles on employee_roles.id = employee_role_id
      where commission_types.id = commission_type_id
        and employee_roles.company_id = commission_types.company_id
        and is_company_admin(commission_types.company_id)
    )
  );
create policy "Admins can remove employee role commission types for their company"
  on employee_role_commission_types for delete using (
    exists (
      select 1 from commission_types
      where commission_types.id = commission_type_id and is_company_admin(commission_types.company_id)
    )
  );
