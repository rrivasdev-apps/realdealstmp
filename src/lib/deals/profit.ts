// The one shared profit calculation, per CLAUDE.md -- not duplicated inline
// in the dashboard or deal detail page. Phase 0 formula only; the
// commission/JV engine comes in Phase 1.
export function calculateProfit(deal: {
  contract_price: number | null
  projected_sales_price: number | null
}): number | null {
  if (deal.contract_price == null || deal.projected_sales_price == null) {
    return null
  }

  return deal.projected_sales_price - deal.contract_price
}
