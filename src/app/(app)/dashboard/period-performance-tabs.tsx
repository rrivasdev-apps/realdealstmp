'use client'

import { useState } from 'react'

import type { PeriodPerformanceRow } from '@/lib/deals/kpi'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Granularity = 'monthly' | 'quarterly' | 'yearly'

const TAB_LABELS: Record<Granularity, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

export function PeriodPerformanceTabs({
  monthly,
  quarterly,
  yearly,
}: {
  monthly: PeriodPerformanceRow[]
  quarterly: PeriodPerformanceRow[]
  yearly: PeriodPerformanceRow[]
}) {
  const [active, setActive] = useState<Granularity>('monthly')
  const rows = { monthly, quarterly, yearly }[active]

  return (
    <div className="mt-2">
      <div className="flex gap-1 border-b border-border">
        {(Object.keys(TAB_LABELS) as Granularity[]).map((granularity) => (
          <button
            key={granularity}
            type="button"
            onClick={() => setActive(granularity)}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              active === granularity
                ? 'border-b-2 border-brand-600 text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {TAB_LABELS[granularity]}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-b-lg border border-t-0 border-border bg-background">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">Period</th>
              <th className="px-4 py-2 font-medium">Deals</th>
              <th className="px-4 py-2 font-medium">Gross Profit</th>
              <th className="px-4 py-2 font-medium">Expenses</th>
              <th className="px-4 py-2 font-medium">Commissions</th>
              <th className="px-4 py-2 font-medium">Net Profit</th>
              <th className="px-4 py-2 font-medium">Avg Net Profit / Deal</th>
              <th className="px-4 py-2 font-medium">Avg Days to Close</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-2 font-medium text-foreground">{row.label}</td>
                <td className="px-4 py-2 text-foreground">{row.dealCount}</td>
                <td className="px-4 py-2 text-foreground">{currency.format(row.grossProfit)}</td>
                <td className="px-4 py-2 text-foreground">{currency.format(row.totalExpenses)}</td>
                <td className="px-4 py-2 text-foreground">{currency.format(row.totalCommissions)}</td>
                <td className="px-4 py-2 text-foreground">{currency.format(row.netProfit)}</td>
                <td className="px-4 py-2 text-foreground">
                  {row.avgNetProfitPerDeal != null ? currency.format(row.avgNetProfitPerDeal) : '—'}
                </td>
                <td className="px-4 py-2 text-foreground">
                  {row.avgDaysToClose != null ? `${Math.round(row.avgDaysToClose)} days` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
