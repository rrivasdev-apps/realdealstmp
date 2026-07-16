create table deals (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,

  -- Property facts
  address text not null,
  market_id uuid references markets (id),
  property_type_id uuid references property_types (id),

  -- AB contract (wholesaler buying from the seller) -- original/current pairing:
  -- original_* is set once at intake and never touched again; the plain
  -- column is the current value, recalculated server-side on renegotiation.
  contract_price numeric,
  original_contract_price numeric,
  contract_date date,
  closing_date date,
  original_closing_date date,
  actual_closing_date date,
  due_diligence_expiration date,
  original_due_diligence_date date,

  -- Dispo -- simple profit calc for Phase 0 is projected_sales_price - contract_price
  projected_sales_price numeric,
  original_projected_sales_price numeric,

  -- Status/meta
  deal_type_id uuid references deal_types (id),
  status_id uuid not null references deal_statuses (id),
  lead_source_id uuid references lead_sources (id),

  custom_fields jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index deals_company_id_idx on deals (company_id);
create index deals_status_id_idx on deals (status_id);

-- DB-level enforcement of "original values are set once at intake and never
-- touched again" -- defense in depth underneath the Route Handler's own
-- field whitelist, in case anything ever writes to this table directly.
create function protect_original_deal_values()
returns trigger
language plpgsql
as $$
begin
  new.original_contract_price := old.original_contract_price;
  new.original_closing_date := old.original_closing_date;
  new.original_due_diligence_date := old.original_due_diligence_date;
  new.original_projected_sales_price := old.original_projected_sales_price;
  return new;
end;
$$;

create trigger protect_original_deal_values_trigger
  before update on deals
  for each row execute function protect_original_deal_values();

alter table deals enable row level security;

create policy "Members can read their company's deals"
  on deals for select using (is_company_member(company_id));
create policy "Members can create deals for their company"
  on deals for insert with check (is_company_member(company_id));
create policy "Members can update their company's deals"
  on deals for update using (is_company_member(company_id));
