// The one shared profit calculation, per CLAUDE.md -- not duplicated inline
// in the dashboard or deal detail page.
//
// Both sides of a deal can be renegotiated after intake, and there's no
// separate "actual" vs "estimated" price field for either side -- whatever
// value is current at the moment the deal closes *is* the closed price.
// contract_price is already the AB side's current value (original_contract_price
// holds the locked intake value instead). This picks the BC side's current
// value the same way: renegotiated_bc_price if a renegotiation has happened,
// else buyer_contract_price once a buyer's locked in, else projected_sales_price
// as the pre-buyer estimate.
export function currentSellingPrice(deal: {
  renegotiated_bc_price: number | null
  buyer_contract_price: number | null
  projected_sales_price: number | null
}): number | null {
  return deal.renegotiated_bc_price ?? deal.buyer_contract_price ?? deal.projected_sales_price
}

export function calculateProfit(deal: {
  contract_price: number | null
  renegotiated_bc_price: number | null
  buyer_contract_price: number | null
  projected_sales_price: number | null
}): number | null {
  const sellingPrice = currentSellingPrice(deal)
  if (deal.contract_price == null || sellingPrice == null) {
    return null
  }

  return sellingPrice - deal.contract_price
}

// The Financial tab cascade (see docs/reference/deal-form.md): Estimated
// Projected Profit -> Estimated Gross Profit (same figure, pre-expense) ->
// Estimated Net Profit Before Commissions (- total_expenses) -> Estimated
// Net Profit (- total_commissions, and - the JV payout when this is a JV
// deal, since it's the same kind of profit-share deduction as a commission).
// All "estimated" while the deal is open; once Closed, the same fields hold
// the final numbers, so no separate actual/estimated variant is needed.
export type ProfitCascade = {
  estimatedProjectedProfit: number | null
  estimatedGrossProfit: number | null
  estimatedNetProfitBeforeCommissions: number | null
  estimatedNetProfit: number | null
}

export function calculateProfitCascade(deal: {
  contract_price: number | null
  renegotiated_bc_price: number | null
  buyer_contract_price: number | null
  projected_sales_price: number | null
  total_expenses: number | null
  total_commissions: number | null
  is_jv_deal: boolean
  split_amount: number | null
}): ProfitCascade {
  const estimatedProjectedProfit = calculateProfit(deal)
  const estimatedGrossProfit = estimatedProjectedProfit

  const estimatedNetProfitBeforeCommissions =
    estimatedGrossProfit == null ? null : estimatedGrossProfit - (deal.total_expenses ?? 0)

  const jvPayout = deal.is_jv_deal ? (deal.split_amount ?? 0) : 0
  const estimatedNetProfit =
    estimatedNetProfitBeforeCommissions == null
      ? null
      : estimatedNetProfitBeforeCommissions - (deal.total_commissions ?? 0) - jvPayout

  return {
    estimatedProjectedProfit,
    estimatedGrossProfit,
    estimatedNetProfitBeforeCommissions,
    estimatedNetProfit,
  }
}
