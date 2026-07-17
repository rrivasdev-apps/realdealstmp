-- BC contract (wholesaler assigning/selling to the end buyer) fields on
-- deals -- see docs/data-model.md's AB/BC contract pattern. Unlike the AB
-- side, there's no buyer at deal creation, so buyer_contract_price starts
-- null and is set for the first time via a later edit rather than at insert.
alter table deals
  add column buyer_found bool not null default false,
  add column buyer_contract_price numeric,
  add column buyer_contract_date date,
  add column bc_contract_closing_date date,
  add column buyer_inspection_deadline date,
  add column renegotiated_bc_price numeric,
  add column buyer_deposit_received bool not null default false,
  add column buyer_deposit_amount numeric;

-- Extends the existing intake-lock trigger with a different rule:
-- buyer_contract_price allows its first write (old value is null), then
-- locks on every write after that -- it can't be unconditionally reverted
-- like the AB original_* fields because it isn't set at insert time.
create or replace function protect_original_deal_values()
returns trigger
language plpgsql
as $$
begin
  new.original_contract_price := old.original_contract_price;
  new.original_closing_date := old.original_closing_date;
  new.original_due_diligence_date := old.original_due_diligence_date;
  new.original_projected_sales_price := old.original_projected_sales_price;
  new.buyer_contract_price := coalesce(old.buyer_contract_price, new.buyer_contract_price);
  return new;
end;
$$;
