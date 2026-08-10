'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { payPeriodRunRange, type PayPeriodSchedule } from '@/lib/pay-periods/schedule'

export type RunnablePayPeriod = PayPeriodSchedule & {
  id: string
  name: string
  payable_employee_count: number
}

export function NewRunForm({ payPeriods }: { payPeriods: RunnablePayPeriod[] }) {
  const t = useTranslations('Payroll')
  const router = useRouter()
  const [payPeriodId, setPayPeriodId] = useState('')
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Periods with no calendar cadence (commission paid immediately on closing)
  // and the name-only rows predating the schedule columns can't drive a run at
  // all -- leaving them out beats offering a choice the server would reject.
  const runnablePayPeriods = payPeriods.filter((payPeriod) => payPeriodRunRange(payPeriod) !== null)

  const selectedPayPeriod = runnablePayPeriods.find((payPeriod) => payPeriod.id === payPeriodId) ?? null
  const derivedRange = selectedPayPeriod ? payPeriodRunRange(selectedPayPeriod) : null
  const blockedOnEmployees = selectedPayPeriod != null && selectedPayPeriod.payable_employee_count === 0

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/payroll-runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Dates are only meaningful for an ad-hoc run -- a pay-period run gets
      // its window derived server-side from the schedule.
      body: JSON.stringify(
        selectedPayPeriod
          ? { pay_period_id: selectedPayPeriod.id }
          : { pay_period_start: payPeriodStart, pay_period_end: payPeriodEnd }
      ),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    router.push(`/payroll/runs/${result.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      {runnablePayPeriods.length > 0 && (
        <label className="field-label">
          {t('payPeriodLabel')}
          <select
            value={payPeriodId}
            onChange={(event) => setPayPeriodId(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">{t('adHocOption')}</option>
            {runnablePayPeriods.map((payPeriod) => (
              <option key={payPeriod.id} value={payPeriod.id}>
                {payPeriod.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {derivedRange ? (
        <p className="text-sm text-muted-foreground">
          {t('scheduleRangePreview', { start: derivedRange.start, end: derivedRange.end })}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="field-label">
            {t('payPeriodStartLabel')}
            <input
              type="date"
              required
              value={payPeriodStart}
              onChange={(event) => setPayPeriodStart(event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
          <label className="field-label">
            {t('payPeriodEndLabel')}
            <input
              type="date"
              required
              value={payPeriodEnd}
              onChange={(event) => setPayPeriodEnd(event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
        </div>
      )}

      {blockedOnEmployees && <p className="text-sm text-danger">{t('noPayableEmployeesWarning')}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting || blockedOnEmployees}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('creatingButton') : t('newRunButton')}
      </button>
    </form>
  )
}
