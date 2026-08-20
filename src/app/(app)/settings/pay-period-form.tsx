'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getPayPeriodLabels } from '@/lib/pay-periods/labels'

export type PayPeriodFormValues = {
  id?: string
  name: string
  paymentType: string
  salaryPayFrequency: string
  salaryType: string
  commissionPayFrequency: string
  firstPayday: string
  nextPayday: string
  comments: string
}

// One form, two modes -- create asks for First Payday (set once, never
// touched again); edit shows First Payday read-only and lets Next Payday
// (the "current" value) be adjusted instead. See
// docs/reference/payroll-periods.md and /api/pay-periods for why these
// aren't the same field.
export function PayPeriodForm({
  mode,
  initialValues,
}: {
  mode: 'create' | 'edit'
  initialValues: PayPeriodFormValues
}) {
  const t = useTranslations('Settings')
  const { PAYMENT_TYPE_LABELS, SALARY_PAY_FREQUENCY_LABELS, SALARY_TYPE_LABELS, COMMISSION_PAY_FREQUENCY_LABELS } =
    getPayPeriodLabels(t)
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof PayPeriodFormValues>(key: K, value: PayPeriodFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const needsSalary = values.paymentType === 'salary' || values.paymentType === 'combined'
  const needsCommission = values.paymentType === 'commission' || values.paymentType === 'combined'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!values.name.trim()) {
      setError(t('nameRequiredError'))
      return
    }

    setSubmitting(true)

    const body = {
      name: values.name,
      payment_type: values.paymentType,
      salary_pay_frequency: needsSalary ? values.salaryPayFrequency : null,
      salary_type: needsSalary ? values.salaryType : null,
      commission_pay_frequency: needsCommission ? values.commissionPayFrequency : null,
      comments: values.comments,
      ...(mode === 'create' ? { first_payday: values.firstPayday } : { next_payday: values.nextPayday }),
    }

    const response = await fetch(mode === 'create' ? '/api/pay-periods' : `/api/pay-periods/${values.id}`, {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    if (mode === 'create') {
      setValues(initialValues)
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-4 rounded border border-border p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="field-label">
          {t('payPeriodNameLabel')}
          <input
            type="text"
            required
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder={t('payPeriodNamePlaceholder')}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('paymentTypeLabel')}
          <select
            required
            value={values.paymentType}
            onChange={(event) => set('paymentType', event.target.value)}
            className="field-input px-3 py-2"
          >
            <option value="">—</option>
            {Object.entries(PAYMENT_TYPE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {needsSalary && (
          <>
            <label className="field-label">
              {t('salaryPayFrequencyLabel')}
              <select
                required
                value={values.salaryPayFrequency}
                onChange={(event) => set('salaryPayFrequency', event.target.value)}
                className="field-input px-3 py-2"
              >
                <option value="">—</option>
                {Object.entries(SALARY_PAY_FREQUENCY_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label">
              {t('salaryTypeLabel')}
              <select
                required
                value={values.salaryType}
                onChange={(event) => set('salaryType', event.target.value)}
                className="field-input px-3 py-2"
              >
                <option value="">—</option>
                {Object.entries(SALARY_TYPE_LABELS).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">{t('salaryTypeHint')}</span>
            </label>
          </>
        )}

        {needsCommission && (
          <label className="field-label">
            {t('commissionPayFrequencyLabel')}
            <select
              required
              value={values.commissionPayFrequency}
              onChange={(event) => set('commissionPayFrequency', event.target.value)}
              className="field-input px-3 py-2"
            >
              <option value="">—</option>
              {Object.entries(COMMISSION_PAY_FREQUENCY_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        {mode === 'create' ? (
          <label className="field-label">
            {t('firstPaydayLabel')}
            <input
              type="date"
              required
              value={values.firstPayday}
              onChange={(event) => set('firstPayday', event.target.value)}
              className="field-input px-3 py-2"
            />
          </label>
        ) : (
          <>
            <label className="field-label">
              {t('firstPaydayLabel')}
              <input
                type="date"
                disabled
                value={values.firstPayday}
                className="rounded border border-input-border bg-muted px-3 py-2 text-muted-foreground"
              />
              <span className="text-xs text-muted-foreground">{t('firstPaydayHint')}</span>
            </label>
            <label className="field-label">
              {t('nextPaydayLabel')}
              <input
                type="date"
                required
                value={values.nextPayday}
                onChange={(event) => set('nextPayday', event.target.value)}
                className="field-input px-3 py-2"
              />
            </label>
          </>
        )}
      </div>

      <label className="field-label">
        {t('commentsLabel')}
        <textarea
          required
          value={values.comments}
          onChange={(event) => set('comments', event.target.value)}
          rows={2}
          className="field-input px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit btn-primary"
      >
        {submitting ? t('savingButton') : mode === 'create' ? t('createPayPeriodButton') : t('saveChangesButton')}
      </button>
    </form>
  )
}
