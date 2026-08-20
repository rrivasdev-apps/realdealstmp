'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import type { PeriodPerformanceRow } from '@/lib/deals/kpi'
import type messages from '@/messages/en.json'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Granularity = 'monthly' | 'quarterly' | 'yearly'

const TAB_LABEL_KEYS: Record<Granularity, keyof (typeof messages)['Dashboard']> = {
  monthly: 'monthly',
  quarterly: 'quarterly',
  yearly: 'yearly',
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
  const t = useTranslations('Dashboard')
  const [active, setActive] = useState<Granularity>('monthly')
  const rows = { monthly, quarterly, yearly }[active]

  return (
    <div className="mt-2">
      <div className="flex gap-1 border-b border-border">
        {(Object.keys(TAB_LABEL_KEYS) as Granularity[]).map((granularity) => (
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
            {t(TAB_LABEL_KEYS[granularity])}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-b-2xl border border-t-0 border-border bg-background shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">{t('colPeriod')}</th>
              <th className="px-4 py-2 font-medium">{t('colDeals')}</th>
              <th className="px-4 py-2 font-medium">{t('colGrossProfit')}</th>
              <th className="px-4 py-2 font-medium">{t('colExpenses')}</th>
              <th className="px-4 py-2 font-medium">{t('colCommissions')}</th>
              <th className="px-4 py-2 font-medium">{t('colNetProfit')}</th>
              <th className="px-4 py-2 font-medium">{t('colAvgNetProfitPerDeal')}</th>
              <th className="px-4 py-2 font-medium">{t('colAvgDaysToClose')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.key} className="transition-colors hover:bg-muted/50">
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
                  {row.avgDaysToClose != null ? t('days', { count: Math.round(row.avgDaysToClose) }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
