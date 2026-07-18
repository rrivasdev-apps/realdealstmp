-- Tracks *when* each side's current price last changed, not just what it
-- currently is -- needed so profit calc (and later, the commission engine)
-- can reason about "whichever renegotiation happened most recently wins."
-- Per Rafael: both AB (seller/contract_price) and BC (buyer/renegotiated_bc_price)
-- sides can be renegotiated, and whatever value is present at the moment the
-- deal closes is the final price everything gets calculated on -- so there's
-- no separate "actual" vs "estimated" price field, just the current one plus
-- when it was last set.
--
-- These dates are server-computed, never client-supplied (same rule as
-- closing_date/original_* elsewhere): the trigger stamps current_date
-- whenever the paired price actually changes on an UPDATE, and leaves it
-- alone otherwise. Not stamped on INSERT -- the price set at intake isn't a
-- renegotiation.
alter table deals
  add column contract_price_renegotiated_date date,
  add column renegotiated_bc_date date;

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

  if new.contract_price is distinct from old.contract_price then
    new.contract_price_renegotiated_date := current_date;
  else
    new.contract_price_renegotiated_date := old.contract_price_renegotiated_date;
  end if;

  if new.renegotiated_bc_price is distinct from old.renegotiated_bc_price then
    new.renegotiated_bc_date := current_date;
  else
    new.renegotiated_bc_date := old.renegotiated_bc_date;
  end if;

  return new;
end;
$$;
