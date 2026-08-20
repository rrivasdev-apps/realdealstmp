import { getLocale, getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'

import { FileSpreadsheetIcon, FileTextIcon, PercentIcon, RouteIcon } from '@/components/icons'
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

  const t = await getTranslations('Dashboard')
  const supabase = await createClient()

  const [{ data: dealsData }, { data: offersData }] = await Promise.all([
    supabase.from('deals').select(DEAL_FIELDS),
    supabase.from('offers').select('deal_id, offer_statuses(name)'),
  ])

  let deals = (dealsData as unknown as Deal[]) ?? []
  let offers = (offersData as unknown as Offer[]) ?? []

  // Members see only their own slice of the company's deals; admins and
  // anyone with the can_view_financials capability see everything.
  // deal_employees is company-wide readable, so this filter is applied in
  // JS the same way status filtering already is on /deals.
  if (profile.role !== 'admin' && !profile.permissions?.can_view_financials) {
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

  // Period row labels ("ago 2026", "T3 2026") are built here rather than in the
  // client component because the rows are already assembled server-side.
  const periodLabels = { locale: await getLocale(), quarterPrefix: t('quarterPrefix') }
  const monthly = buildPeriodPerformance(closedFundedDeals, 'monthly', 12, new Date(), periodLabels)
  const quarterly = buildPeriodPerformance(closedFundedDeals, 'quarterly', 8, new Date(), periodLabels)
  const yearly = buildPeriodPerformance(closedFundedDeals, 'yearly', 6, new Date(), periodLabels)

  return (
    <div>
      <h1 className="heading-page">{t('title')}</h1>

      <section className="mt-6">
        <h2 className="heading-subsection">{t('pipeline')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <PipelineCard
            icon={RouteIcon}
            iconBg="bg-brand-600/10"
            iconColor="text-brand-600"
            label={t('openDeals')}
            value={String(openDeals.length)}
          />
          <PipelineCard
            icon={FileSpreadsheetIcon}
            iconBg="bg-landing-lime-dark/10"
            iconColor="text-landing-lime-dark"
            label={t('projectedProfit')}
            value={currency.format(projectedProfit)}
          />
          <PipelineCard
            icon={PercentIcon}
            iconBg="bg-landing-cyan/10"
            iconColor="text-landing-cyan"
            label={t('jvExpenses')}
            value={currency.format(jvExpenses)}
          />
          <PipelineCard
            icon={FileTextIcon}
            iconBg="bg-landing-navy/10"
            iconColor="text-landing-navy"
            label={t('openOffers')}
            value={String(openOfferCount)}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="heading-subsection">{t('periodPerformance')}</h2>
        <PeriodPerformanceTabs monthly={monthly} quarterly={quarterly} yearly={yearly} />
      </section>
    </div>
  )
}

function PipelineCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: (props: { className?: string }) => React.ReactElement
  iconBg: string
  iconColor: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <div className="mt-4 text-2xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  )
}
