-- Expenses and commissions -- the two deduction steps in the Financial tab's
-- profit cascade (see docs/reference/deal-form.md's Financial tab section):
-- Estimated Projected Profit -> Estimated Gross Profit (same figure) ->
-- Estimated Net Profit Before Commissions (- expenses) -> Estimated Net
-- Profit (- commissions - JV payout). Kept as flat totals for Phase 1,
-- matching the legacy app's "Total Expenses"/"Total Commissions" fields --
-- itemized expense/commission line items are a later pass if a reference doc
-- for that UI ever lands.
alter table deals
  add column total_expenses numeric,
  add column total_commissions numeric;
