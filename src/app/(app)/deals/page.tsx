import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { calculateProfit } from '@/lib/deals/profit'
import { statusColors } from '@/lib/deals/status-colors'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { NewDealButton } from './new-deal-button'

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

// Message keys rather than literals -- the badge shows a short label, the
// section heading a fuller one, and both are translated at render time.
const BADGE_LABEL_KEYS = {
  all: 'badgeAll',
  'for-sale': 'badgeForSale',
  'pending-sale': 'badgePendingSale',
  closed: 'badgeClosed',
  'closed-not-funded': 'badgeNotFunded',
  'closed-funded': 'badgeFunded',
  'on-hold': 'badgeOnHold',
  cancelled: 'badgeCancelled',
} as const satisfies Record<FilterKey, string>

const SECTION_LABEL_KEYS = {
  all: 'sectionAll',
  'for-sale': 'sectionForSale',
  'pending-sale': 'sectionPendingSale',
  closed: 'sectionClosed',
  'closed-not-funded': 'sectionNotFunded',
  'closed-funded': 'sectionFunded',
  'on-hold': 'sectionOnHold',
  cancelled: 'sectionCancelled',
} as const satisfies Record<FilterKey, string>

// Which deal_statuses name's color/dot to borrow for a given badge. These are
// row names from the database, not copy -- they stay English. i18n-exempt
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
  const activeFilter: FilterKey = status && status in SECTION_LABEL_KEYS ? (status as FilterKey) : 'all'

  const t = await getTranslations('Deals')
  const profile = await requirePermission('view_whiteboard')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermission')}</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data }, { data: dealTypes }, { data: leadSources }, { data: countries }, { data: company }] = await Promise.all([
    supabase
      .from('deals')
      .select(
        'id, address, contract_price, projected_sales_price, buyer_contract_price, renegotiated_bc_price, closing_date, actual_closing_date, deal_statuses(name)'
      )
      .order('closing_date', { ascending: true }),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('countries').select('id, name, iso_code').order('name'),
    supabase.from('companies').select('default_country_id').eq('id', profile.company_id ?? '').single(),
  ])
  const deals = (data as unknown as Deal[]) ?? []

  const filteredDeals = deals.filter((deal) => matchesFilter(deal, activeFilter))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-page">{t('title')}</h1>
        <NewDealButton
          dealTypes={dealTypes ?? []}
          leadSources={leadSources ?? []}
          countries={countries ?? []}
          defaultCountryId={company?.default_country_id ?? null}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <FilterBadge filter="all" active={activeFilter} deals={deals} />
        <FilterBadge filter="for-sale" active={activeFilter} deals={deals} />
        <FilterBadge filter="pending-sale" active={activeFilter} deals={deals} />
        <ClosedGroup active={activeFilter} deals={deals} />
        <FilterBadge filter="on-hold" active={activeFilter} deals={deals} />
        <FilterBadge filter="cancelled" active={activeFilter} deals={deals} />
      </div>

      <DealSection title={t(SECTION_LABEL_KEYS[activeFilter])} deals={filteredDeals} />
    </div>
  )
}

async function FilterBadge({ filter, active, deals }: { filter: FilterKey; active: FilterKey; deals: Deal[] }) {
  const t = await getTranslations('Deals')
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
        {t(BADGE_LABEL_KEYS[filter])}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
      <div className="mt-1 text-xs text-muted-foreground">{t('profitSuffix', { amount: currency.format(profit) })}</div>
    </Link>
  )
}

// Closed / Not Funded / Funded are a family -- Not Funded + Funded always
// sum to Closed -- so they render as one connected, tinted strip (shared
// background + border, thin dividers) instead of three separate cards, while
// still occupying the same 3 grid columns and h-28 height as their siblings.
async function ClosedGroup({ active, deals }: { active: FilterKey; deals: Deal[] }) {
  const t = await getTranslations('Deals')
  const colors = statusColors('Closed')
  const cells: FilterKey[] = ['closed', 'closed-not-funded', 'closed-funded']

  return (
    <div className="col-span-2 grid grid-cols-3 divide-x divide-status-closed/30 overflow-hidden rounded-lg border border-status-closed/30 bg-status-closed/5 sm:col-span-3">
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
              {t(BADGE_LABEL_KEYS[filter])}
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{count}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t('profitSuffix', { amount: currency.format(profit) })}</div>
          </Link>
        )
      })}
    </div>
  )
}

async function DealSection({ title, deals }: { title: string; deals: Deal[] }) {
  const t = await getTranslations('Deals')
  return (
    <section className="mt-8">
      <h2 className="heading-subsection">{title}</h2>
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
                  {deal.closing_date ? t('closingOn', { date: deal.closing_date }) : t('noClosingDate')}
                </div>
              </div>
              <div className="text-right text-sm">
                <div className="text-foreground">
                  {deal.contract_price != null
                    ? t('contractAmount', { amount: currency.format(deal.contract_price) })
                    : t('contractEmpty')}
                </div>
                <div className="text-muted-foreground">
                  {profit != null ? t('profitAmount', { amount: currency.format(profit) }) : t('profitEmpty')}
                </div>
              </div>
            </li>
          )
        })}
        {deals.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">{t('noDealsHere')}</li>}
      </ul>
    </section>
  )
}
