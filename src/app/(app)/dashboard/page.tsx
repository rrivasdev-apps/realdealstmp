import Link from 'next/link'

import { calculateProfit } from '@/lib/deals/profit'
import { statusColors } from '@/lib/deals/status-colors'
import { createClient } from '@/lib/supabase/server'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const STATUS_ORDER = ['For Sale', 'Pending Sale', 'Closed', 'On Hold', 'Cancelled']

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: deals } = await supabase
    .from('deals')
    .select('id, address, contract_price, projected_sales_price, closing_date, deal_statuses(name)')
    .order('closing_date', { ascending: true })

  const byStatus = STATUS_ORDER.map((name) => {
    const dealsForStatus = deals?.filter((deal) => deal.deal_statuses?.name === name) ?? []
    const profit = dealsForStatus.reduce((sum, deal) => sum + (calculateProfit(deal) ?? 0), 0)
    return { name, count: dealsForStatus.length, profit }
  })

  const openDeals = deals?.filter((deal) =>
    ['For Sale', 'Pending Sale'].includes(deal.deal_statuses?.name ?? '')
  )
  const closedDeals = deals?.filter((deal) => deal.deal_statuses?.name === 'Closed')

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

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {byStatus.map((status) => {
          const colors = statusColors(status.name)
          return (
            <div key={status.name} className="rounded-lg border border-border bg-background p-4">
              <div className={`text-xs font-medium uppercase tracking-wide ${colors.text}`}>
                {status.name}
              </div>
              <div className="mt-2 text-2xl font-semibold text-foreground">{status.count}</div>
              <div className="mt-1 text-xs text-muted-foreground">{currency.format(status.profit)} profit</div>
            </div>
          )
        })}
      </div>

      <DealSection title="Open deals" deals={openDeals ?? []} />
      <DealSection title="Closed deals" deals={closedDeals ?? []} />
    </div>
  )
}

function DealSection({
  title,
  deals,
}: {
  title: string
  deals: {
    id: string
    address: string
    contract_price: number | null
    projected_sales_price: number | null
    closing_date: string | null
  }[]
}) {
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
                  {deal.contract_price != null ? currency.format(deal.contract_price) : '—'}
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
