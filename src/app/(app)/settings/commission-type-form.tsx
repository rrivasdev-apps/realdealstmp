'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BASIS_LABELS: Record<string, string> = {
  contract_price: 'Contract price',
  gross_profit: 'Gross profit',
  current_selling_price: 'Current selling price',
}

export type CommissionTypeFormValues = {
  id?: string
  name: string
  description: string
  category: 'flat' | 'percentage'
  basis: string
  value: string
}

const BLANK_VALUES: CommissionTypeFormValues = {
  name: '',
  description: '',
  category: 'flat',
  basis: 'contract_price',
  value: '',
}

export function CommissionTypeForm({
  mode = 'create',
  initialValues,
  onSaved,
  onCancel,
}: {
  mode?: 'create' | 'edit'
  initialValues?: CommissionTypeFormValues
  onSaved?: () => void
  onCancel?: () => void
}) {
  const router = useRouter()
  const [values, setValues] = useState<CommissionTypeFormValues>(initialValues ?? BLANK_VALUES)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url = mode === 'edit' ? `/api/commission-types/${values.id}` : '/api/commission-types'
    const method = mode === 'edit' ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        description: values.description || null,
        category: values.category,
        basis: values.category === 'percentage' ? values.basis : null,
        value: values.value ? Number(values.value) : null,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    if (mode === 'create') {
      setValues(BLANK_VALUES)
    }
    router.refresh()
    onSaved?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="field-label">
          Name
          <input
            type="text"
            required
            value={values.name}
            onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="e.g. Closer commission"
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          Category
          <select
            value={values.category}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, category: event.target.value as 'flat' | 'percentage' }))
            }
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="flat">Flat fee</option>
            <option value="percentage">Percentage</option>
          </select>
        </label>

        {values.category === 'percentage' && (
          <label className="field-label">
            Basis
            <select
              value={values.basis}
              onChange={(event) => setValues((prev) => ({ ...prev, basis: event.target.value }))}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              {Object.entries(BASIS_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field-label">
          {values.category === 'flat' ? 'Amount' : 'Percent'}
          <input
            type="number"
            step="0.01"
            required
            value={values.value}
            onChange={(event) => setValues((prev) => ({ ...prev, value: event.target.value }))}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      </div>

      <label className="field-label">
        Description
        <textarea
          value={values.description}
          onChange={(event) => setValues((prev) => ({ ...prev, description: event.target.value }))}
          rows={2}
          placeholder="Use case, who this applies to, why it exists"
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Add commission type'}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onCancel}
            className="w-fit rounded border border-input-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
