import { redirect } from 'next/navigation'

import { calculateProfit } from '@/lib/deals/profit'
import { buildPeriodPerformance, type PeriodDeal } from '@/lib/deals/kpi'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { PeriodPerformanceTabs } from './period-performance-tabs'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Deal = PeriodDeal & {
  id: string
  deal_statuses: { name: string } | null
}

type Offer = {
  deal_id: string
  offer_statuses: { name: string } | null
}

const DEAL_FIELDS =
  'id, contract_price, renegotiated_bc_price, buyer_contract_price, projected_sales_price, is_jv_deal, split_amount, total_expenses, total_commissions, contract_date, actual_closing_date, deal_statuses(name)'

export default async function DashboardPage() {
  const profile = await requireProfile()
  if (!profile) {
    redirect('/login')
  }

  const supabase = await createClient()

  const [{ data: dealsData }, { data: offersData }] = await Promise.all([
    supabase.from('deals').select(DEAL_FIELDS),
    supabase.from('offers').select('deal_id, offer_statuses(name)'),
  ])

  let deals = (dealsData as unknown as Deal[]) ?? []
  let offers = (offersData as unknown as Offer[]) ?? []

  // Members see only their own slice of the company's deals; admins see
  // everything. deal_employees is company-wide readable, so this filter is
  // applied in JS the same way status filtering already is on /deals.
  if (profile.role !== 'admin') {
    const { data: assignments } = await supabase
      .from('deal_employees')
      .select('deal_id')
      .eq('profile_id', profile.id)
    const assignedDealIds = new Set((assignments ?? []).map((row) => row.deal_id))
    deals = deals.filter((deal) => assignedDealIds.has(deal.id))
    offers = offers.filter((offer) => assignedDealIds.has(offer.deal_id))
  }

  const openDeals = deals.filter((deal) => {
    const status = deal.deal_statuses?.name
    return status === 'For Sale' || status === 'Pending Sale'
  })
  const closedFundedDeals = deals.filter(
    (deal) => deal.deal_statuses?.name === 'Closed' && deal.actual_closing_date != null
  )
  const openOfferCount = offers.filter((offer) => {
    const status = offer.offer_statuses?.name
    return status === 'Pending' || status === 'Countered'
  }).length

  const projectedProfit = openDeals.reduce((sum, deal) => sum + (calculateProfit(deal) ?? 0), 0)
  const jvExpenses = openDeals
    .filter((deal) => deal.is_jv_deal)
    .reduce((sum, deal) => sum + (deal.split_amount ?? 0), 0)

  const monthly = buildPeriodPerformance(closedFundedDeals, 'monthly', 12)
  const quarterly = buildPeriodPerformance(closedFundedDeals, 'quarterly', 8)
  const yearly = buildPeriodPerformance(closedFundedDeals, 'yearly', 6)

  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Pipeline</h2>
        <div className="mt-2 grid grid-cols-4 gap-4">
          <PipelineCard label="Open Deals" value={String(openDeals.length)} />
          <PipelineCard label="Projected Profit" value={currency.format(projectedProfit)} />
          <PipelineCard label="JV Expenses" value={currency.format(jvExpenses)} />
          <PipelineCard label="Open Offers" value={String(openOfferCount)} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Period Performance</h2>
        <PeriodPerformanceTabs monthly={monthly} quarterly={quarterly} yearly={yearly} />
      </section>
    </div>
  )
}

function PipelineCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-28 flex-col justify-center rounded-lg border border-border bg-background p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
    </div>
  )
}
