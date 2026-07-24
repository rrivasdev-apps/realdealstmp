// dateStr is a Postgres `date` ('YYYY-MM-DD') -- built via UTC millis rather than
// `new Date(dateStr)` arithmetic to avoid a local-timezone shift landing on the wrong
// day, same approach as the private day-math in kpi.ts.
export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const result = new Date(Date.UTC(year, month - 1, day + days))
  const y = result.getUTCFullYear()
  const m = String(result.getUTCMonth() + 1).padStart(2, '0')
  const d = String(result.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
