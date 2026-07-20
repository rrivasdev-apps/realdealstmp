import Link from 'next/link'

import { calculateProfit } from '@/lib/deals/profit'
import { statusColors } from '@/lib/deals/status-colors'
import { createClient } from '@/lib/supabase/server'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Deal = {
  id: string
  address: string
  contract_price: number | null
  projected_sales_price: number | null
  buyer_contract_price: number | null
  renegotiated_bc_price: number | null
  closing_date: string | null
  actual_closing_date: string | null
  deal_statuses: { name: string } | null
}

type FilterKey =
  | 'all'
  | 'for-sale'
  | 'pending-sale'
  | 'closed'
  | 'closed-not-funded'
  | 'closed-funded'
  | 'on-hold'
  | 'cancelled'

// Short label shown on the badge itself.
const BADGE_LABELS: Record<FilterKey, string> = {
  all: 'All Deals',
  'for-sale': 'For Sale',
  'pending-sale': 'Pending Sale',
  closed: 'Closed',
  'closed-not-funded': 'Not Funded',
  'closed-funded': 'Funded',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled',
}

// Fuller label shown as the heading above the filtered deal list.
const SECTION_LABELS: Record<FilterKey, string> = {
  all: 'All deals',
  'for-sale': 'For Sale',
  'pending-sale': 'Pending Sale',
  closed: 'Closed',
  'closed-not-funded': 'Closed, Not Yet Funded',
  'closed-funded': 'Closed & Funded',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled',
}

// Which deal_statuses name's color/dot to borrow for a given badge.
const BADGE_STATUS_COLOR: Record<FilterKey, string | null> = {
  all: null,
  'for-sale': 'For Sale',
  'pending-sale': 'Pending Sale',
  closed: 'Closed',
  'closed-not-funded': 'Closed',
  'closed-funded': 'Closed',
  'on-hold': 'On Hold',
  cancelled: 'Cancelled',
}

function matchesFilter(deal: Deal, filter: FilterKey): boolean {
  const status = deal.deal_statuses?.name
  switch (filter) {
    case 'all':
      return true
    case 'for-sale':
      return status === 'For Sale'
    case 'pending-sale':
      return status === 'Pending Sale'
    case 'closed':
      return status === 'Closed'
    case 'closed-funded':
      return status === 'Closed' && deal.actual_closing_date != null
    case 'closed-not-funded':
      return status === 'Closed' && deal.actual_closing_date == null
    case 'on-hold':
      return status === 'On Hold'
    case 'cancelled':
      return status === 'Cancelled'
  }
}

function summarize(deals: Deal[], filter: FilterKey) {
  const matched = deals.filter((deal) => matchesFilter(deal, filter))
  const profit = matched.reduce((sum, deal) => sum + (calculateProfit(deal) ?? 0), 0)
  return { count: matched.length, profit }
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeFilter: FilterKey = status && status in SECTION_LABELS ? (status as FilterKey) : 'all'

  const supabase = await createClient()
  const { data } = await supabase
    .from('deals')
    .select(
      'id, address, contract_price, projected_sales_price, buyer_contract_price, renegotiated_bc_price, closing_date, actual_closing_date, deal_statuses(name)'
    )
    .order('closing_date', { ascending: true })
  const deals = (data as unknown as Deal[]) ?? []

  const filteredDeals = deals.filter((deal) => matchesFilter(deal, activeFilter))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Whiteboard</h1>
        <Link
          href="/deals/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          New deal
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-6 gap-4">
        <FilterBadge filter="all" active={activeFilter} deals={deals} />
        <FilterBadge filter="for-sale" active={activeFilter} deals={deals} />
        <FilterBadge filter="pending-sale" active={activeFilter} deals={deals} />
        <ClosedGroup active={activeFilter} deals={deals} />
        <FilterBadge filter="on-hold" active={activeFilter} deals={deals} />
        <FilterBadge filter="cancelled" active={activeFilter} deals={deals} />
      </div>

      <DealSection title={SECTION_LABELS[activeFilter]} deals={filteredDeals} />
    </div>
  )
}

function FilterBadge({ filter, active, deals }: { filter: FilterKey; active: FilterKey; deals: Deal[] }) {
  const { count, profit } = summarize(deals, filter)
  const isActive = active === filter
  const colorStatus = BADGE_STATUS_COLOR[filter]
  const colors = colorStatus ? statusColors(colorStatus) : null

  return (
    <Link
      href={filter === 'all' ? '/deals' : `/deals?status=${filter}`}
      className={`flex h-28 flex-col justify-center rounded-lg border p-4 transition-colors ${
        isActive ? 'border-brand-600 bg-brand-600/5' : 'border-border bg-background hover:bg-muted/50'
      }`}
    >
      <div className={`text-xs font-medium uppercase tracking-wide ${colors?.text ?? 'text-foreground'}`}>
        {BADGE_LABELS[filter]}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
      <div className="mt-1 text-xs text-muted-foreground">{currency.format(profit)} profit</div>
    </Link>
  )
}

// Closed / Not Funded / Funded are a family -- Not Funded + Funded always
// sum to Closed -- so they render as one connected, tinted strip (shared
// background + border, thin dividers) instead of three separate cards, while
// still occupying the same 3 grid columns and h-28 height as their siblings.
function ClosedGroup({ active, deals }: { active: FilterKey; deals: Deal[] }) {
  const colors = statusColors('Closed')
  const cells: FilterKey[] = ['closed', 'closed-not-funded', 'closed-funded']

  return (
    <div className="col-span-3 grid grid-cols-3 divide-x divide-status-closed/30 overflow-hidden rounded-lg border border-status-closed/30 bg-status-closed/5">
      {cells.map((filter) => {
        const { count, profit } = summarize(deals, filter)
        const isActive = active === filter
        return (
          <Link
            key={filter}
            href={`/deals?status=${filter}`}
            className={`flex h-28 flex-col justify-center p-4 transition-colors ${
              isActive ? 'bg-brand-600/10 ring-2 ring-inset ring-brand-600' : 'hover:bg-status-closed/10'
            }`}
          >
            <div className={`text-xs font-medium uppercase tracking-wide ${colors.text}`}>
              {BADGE_LABELS[filter]}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
            <div className="mt-1 text-xs text-muted-foreground">{currency.format(profit)} profit</div>
          </Link>
        )
      })}
    </div>
  )
}

function DealSection({ title, deals }: { title: string; deals: Deal[] }) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
        {deals.map((deal) => {
          const profit = calculateProfit(deal)
          return (
            <li key={deal.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Link href={`/deals/${deal.id}`} className="font-medium text-foreground hover:text-brand-600">
                  {deal.address}
                </Link>
                <div className="text-sm text-muted-foreground">
                  {deal.closing_date ? `Closing ${deal.closing_date}` : 'No closing date set'}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-foreground">
                  {deal.contract_price != null ? `Contract: ${currency.format(deal.contract_price)}` : 'Contract: —'}
                </div>
                <div className="text-muted-foreground">
                  {profit != null ? `Profit: ${currency.format(profit)}` : 'Profit: —'}
                </div>
              </div>
            </li>
          )
        })}
        {deals.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No deals here yet.</li>}
      </ul>
    </section>
  )
}
