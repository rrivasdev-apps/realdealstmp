// Pay-period date math: which day a schedule pays next, and which stretch of
// days a payroll run for that payday covers. Deliberately has no 'server-only'
// (unlike validate.ts in this folder) -- the New Run form previews the derived
// range client-side using these same functions, so the number the admin sees
// before creating a run is the number the server computes when it creates it.
//
// All dates are 'YYYY-MM-DD' strings handled in UTC parts, never via
// `new Date(iso)` local-time parsing, which shifts the day west of Greenwich.

export type CalendarFrequency = 'weekly' | 'biweekly' | 'once_a_month' | 'twice_a_month' | 'quarterly'

export type PayPeriodSchedule = {
  salary_pay_frequency: string | null
  commission_pay_frequency: string | null
  first_payday: string | null
  next_payday: string | null
}

const CALENDAR_FREQUENCIES: CalendarFrequency[] = [
  'weekly',
  'biweekly',
  'once_a_month',
  'twice_a_month',
  'quarterly',
]

function isCalendarFrequency(value: string | null): value is CalendarFrequency {
  return value != null && (CALENDAR_FREQUENCIES as string[]).includes(value)
}

function parseDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

function formatDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function addDays(iso: string, days: number) {
  const { year, month, day } = parseDate(iso)
  const shifted = new Date(Date.UTC(year, month - 1, day + days))
  return formatDate(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate())
}

// Month-anchored step, clamping only the target month's day: an anchor of the
// 31st lands on Feb 28 and then back on Mar 31, rather than degrading to the
// 28th of every following month.
function addMonths(iso: string, months: number, anchorDay: number) {
  const { year, month } = parseDate(iso)
  const absolute = year * 12 + (month - 1) + months
  const targetYear = Math.floor(absolute / 12)
  const targetMonth = (absolute % 12) + 1
  return formatDate(targetYear, targetMonth, Math.min(anchorDay, daysInMonth(targetYear, targetMonth)))
}

// The two paydays of a given month for a twice-a-month schedule, always 15 days
// apart and always including the anchor day itself. An anchor past the 15th is
// read as the *later* of the two slots (a 20th anchor pays the 5th and 20th),
// which keeps both slots distinct -- anchoring low and adding 15 would collapse
// them in short months when the anchor is late.
function semiMonthlySlots(anchorDay: number, year: number, month: number): [number, number] {
  const low = anchorDay > 15 ? anchorDay - 15 : anchorDay
  return [low, Math.min(low + 15, daysInMonth(year, month))]
}

export function advancePayday(payday: string, anchor: string, frequency: CalendarFrequency): string {
  const anchorDay = parseDate(anchor).day

  if (frequency === 'weekly') return addDays(payday, 7)
  if (frequency === 'biweekly') return addDays(payday, 14)
  if (frequency === 'once_a_month') return addMonths(payday, 1, anchorDay)
  if (frequency === 'quarterly') return addMonths(payday, 3, anchorDay)

  const { year, month, day } = parseDate(payday)
  const [low, high] = semiMonthlySlots(anchorDay, year, month)
  if (day < high) return formatDate(year, month, high)
  return addMonths(formatDate(year, month, 1), 1, low)
}

export function previousPayday(payday: string, anchor: string, frequency: CalendarFrequency): string {
  const anchorDay = parseDate(anchor).day

  if (frequency === 'weekly') return addDays(payday, -7)
  if (frequency === 'biweekly') return addDays(payday, -14)
  if (frequency === 'once_a_month') return addMonths(payday, -1, anchorDay)
  if (frequency === 'quarterly') return addMonths(payday, -3, anchorDay)

  const { year, month, day } = parseDate(payday)
  const [low] = semiMonthlySlots(anchorDay, year, month)
  if (day > low) return formatDate(year, month, low)

  const previousMonth = addMonths(formatDate(year, month, 1), -1, 1)
  const { year: previousYear, month: previousMonthNumber } = parseDate(previousMonth)
  const [, previousHigh] = semiMonthlySlots(anchorDay, previousYear, previousMonthNumber)
  return formatDate(previousYear, previousMonthNumber, previousHigh)
}

// Salary drives the calendar when a period pays both: 'immediately_on_closing'
// is the only commission frequency that isn't a calendar cadence at all, and a
// combined period still has to pay its salary side on a schedule. A
// commission-only period set to pay on closing has no calendar cadence and
// returns null -- it can't drive a scheduled run (the commission engine pays it
// off the deal closing instead, see src/lib/deals/commissions.ts).
export function schedulingFrequency(payPeriod: PayPeriodSchedule): CalendarFrequency | null {
  if (isCalendarFrequency(payPeriod.salary_pay_frequency)) return payPeriod.salary_pay_frequency
  if (isCalendarFrequency(payPeriod.commission_pay_frequency)) return payPeriod.commission_pay_frequency
  return null
}

// The window a run for this period's upcoming payday covers: everything since
// the previous payday, through the payday itself. Returns null for periods that
// can't be run on a calendar (no frequency, or no payday ever set -- true of
// the name-only rows that predate 20260728000001_pay_period_details.sql).
export function payPeriodRunRange(payPeriod: PayPeriodSchedule): { start: string; end: string } | null {
  const frequency = schedulingFrequency(payPeriod)
  const payday = payPeriod.next_payday ?? payPeriod.first_payday
  const anchor = payPeriod.first_payday ?? payday

  if (!frequency || !payday || !anchor) {
    return null
  }

  return { start: addDays(previousPayday(payday, anchor, frequency), 1), end: payday }
}
