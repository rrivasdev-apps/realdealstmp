// Period Performance reporting -- see docs/data-model.md's "Reporting split"
// note: Pipeline (all-time, open deals) and Period Performance (Monthly/
// Quarterly/Yearly, closed & funded deals) are two separate queries, not one.
// Builds on calculateProfitCascade (profit.ts) rather than re-deriving the
// gross/net profit math, per CLAUDE.md's "one shared function" rule.
import { calculateProfitCascade } from './profit'

export type PeriodGranularity = 'monthly' | 'quarterly' | 'yearly'

export type PeriodPerformanceRow = {
  key: string // sortable: '2026-07' | '2026-Q3' | '2026'
  label: string // display: 'Jul 2026' | 'Q3 2026' | '2026'
  dealCount: number
  grossProfit: number
  totalExpenses: number
  totalCommissions: number
  netProfit: number
  avgNetProfitPerDeal: number | null
  avgDaysToClose: number | null
}

export type PeriodDeal = {
  contract_date: string | null
  actual_closing_date: string | null
  contract_price: number | null
  renegotiated_bc_price: number | null
  buyer_contract_price: number | null
  projected_sales_price: number | null
  total_expenses: number | null
  total_commissions: number | null
  is_jv_deal: boolean
  split_amount: number | null
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

// dateStr is a Postgres `date` ('YYYY-MM-DD') -- split on '-' rather than
// `new Date(dateStr)` to avoid a UTC/local timezone shift moving a deal into
// the wrong period.
function parseDateParts(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month, day }
}

export function periodKey(dateStr: string, granularity: PeriodGranularity): { key: string; label: string } {
  const { year, month } = parseDateParts(dateStr)

  if (granularity === 'yearly') {
    return { key: String(year), label: String(year) }
  }
  if (granularity === 'quarterly') {
    const quarter = Math.ceil(month / 3)
    return { key: `${year}-Q${quarter}`, label: `Q${quarter} ${year}` }
  }
  return { key: `${year}-${pad2(month)}`, label: `${MONTH_LABELS[month - 1]} ${year}` }
}

// Steps `count` periods back from (year, month), returning the (year, month)
// of the first month of that earlier period.
function stepPeriodBack(year: number, month: number, granularity: PeriodGranularity, count: number) {
  if (granularity === 'yearly') {
    return { year: year - count, month: 1 }
  }
  if (granularity === 'quarterly') {
    const quarterIndex = Math.floor((year * 4 + Math.ceil(month / 3) - 1) - count)
    const newYear = Math.floor(quarterIndex / 4)
    const newQuarter = quarterIndex - newYear * 4
    return { year: newYear, month: newQuarter * 3 + 1 }
  }
  const monthIndex = year * 12 + (month - 1) - count
  const newYear = Math.floor(monthIndex / 12)
  const newMonth = monthIndex - newYear * 12
  return { year: newYear, month: newMonth + 1 }
}

function daysBetween(startStr: string, endStr: string): number {
  const start = parseDateParts(startStr)
  const end = parseDateParts(endStr)
  const startUtc = Date.UTC(start.year, start.month - 1, start.day)
  const endUtc = Date.UTC(end.year, end.month - 1, end.day)
  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24))
}

// Builds a rolling window of `periodCount` periods ending at the current one
// (most recent first), pre-seeded at zero so a quiet recent period still
// shows up rather than silently disappearing from the table. Only deals with
// `actual_closing_date` set are counted -- callers should already have
// filtered to Closed & Funded deals (see isDealFunded in commissions.ts).
export function buildPeriodPerformance(
  deals: PeriodDeal[],
  granularity: PeriodGranularity,
  periodCount: number,
  referenceDate: Date = new Date()
): PeriodPerformanceRow[] {
  const refYear = referenceDate.getFullYear()
  const refMonth = referenceDate.getMonth() + 1

  type Accumulator = PeriodPerformanceRow & { totalDaysToClose: number; daysToCloseCount: number }
  const rows = new Map<string, Accumulator>()

  for (let i = 0; i < periodCount; i++) {
    const { year, month } = stepPeriodBack(refYear, refMonth, granularity, i)
    const { key, label } = periodKey(`${year}-${pad2(month)}-01`, granularity)
    rows.set(key, {
      key,
      label,
      dealCount: 0,
      grossProfit: 0,
      totalExpenses: 0,
      totalCommissions: 0,
      netProfit: 0,
      avgNetProfitPerDeal: null,
      avgDaysToClose: null,
      totalDaysToClose: 0,
      daysToCloseCount: 0,
    })
  }

  for (const deal of deals) {
    if (!deal.actual_closing_date) continue
    const { key } = periodKey(deal.actual_closing_date, granularity)
    const row = rows.get(key)
    if (!row) continue // outside the rolling window

    const cascade = calculateProfitCascade(deal)
    row.dealCount += 1
    row.grossProfit += cascade.estimatedGrossProfit ?? 0
    row.totalExpenses += deal.total_expenses ?? 0
    row.totalCommissions += deal.total_commissions ?? 0
    row.netProfit += cascade.estimatedNetProfit ?? 0

    if (deal.contract_date) {
      row.totalDaysToClose += daysBetween(deal.contract_date, deal.actual_closing_date)
      row.daysToCloseCount += 1
    }
  }

  return Array.from(rows.values())
    .sort((a, b) => (a.key < b.key ? 1 : -1))
    .map(({ totalDaysToClose, daysToCloseCount, ...row }) => ({
      ...row,
      avgNetProfitPerDeal: row.dealCount > 0 ? row.netProfit / row.dealCount : null,
      avgDaysToClose: daysToCloseCount > 0 ? totalDaysToClose / daysToCloseCount : null,
    }))
}
