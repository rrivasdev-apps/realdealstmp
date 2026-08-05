'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Employee = { id: string; name: string }

export function PayrollPaymentForm({ employees }: { employees: Employee[] }) {
  const t = useTranslations('Payroll')
  const router = useRouter()
  const [profileId, setProfileId] = useState('')
  const [amount, setAmount] = useState('')
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/payroll-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile_id: profileId,
        amount: amount ? Number(amount) : null,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setProfileId('')
    setAmount('')
    setPayPeriodStart('')
    setPayPeriodEnd('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="field-label">
          {t('employeeLabel')}
          <select
            required
            value={profileId}
            onChange={(event) => setProfileId(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">{t('chooseEmployeePlaceholder')}</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field-label">
          {t('amountLabel')}
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

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

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('recordingButton') : t('recordPaymentButton')}
      </button>
    </form>
  )
}
