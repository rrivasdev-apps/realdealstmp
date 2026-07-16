'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export type DealFormValues = {
  id?: string
  address: string
  market_id: string
  property_type_id: string
  deal_type_id: string
  lead_source_id: string
  status_id: string
  contract_price: string
  contract_date: string
  closing_date: string
  due_diligence_expiration: string
  actual_closing_date: string
  projected_sales_price: string
}

export function DealForm({
  mode,
  initialValues,
  markets,
  propertyTypes,
  dealTypes,
  leadSources,
  dealStatuses,
}: {
  mode: 'create' | 'edit'
  initialValues: DealFormValues
  markets: LookupOption[]
  propertyTypes: LookupOption[]
  dealTypes: LookupOption[]
  leadSources: LookupOption[]
  dealStatuses: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url = mode === 'create' ? '/api/deals' : `/api/deals/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const payload = {
      address: values.address,
      market_id: values.market_id || null,
      property_type_id: values.property_type_id || null,
      deal_type_id: values.deal_type_id || null,
      lead_source_id: values.lead_source_id || null,
      status_id: values.status_id || undefined,
      contract_price: values.contract_price ? Number(values.contract_price) : null,
      contract_date: values.contract_date || null,
      closing_date: values.closing_date || null,
      due_diligence_expiration: values.due_diligence_expiration || null,
      actual_closing_date: values.actual_closing_date || null,
      projected_sales_price: values.projected_sales_price ? Number(values.projected_sales_price) : null,
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Address
        <input
          type="text"
          required
          value={values.address}
          onChange={(event) => set('address', event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Market
          <select
            value={values.market_id}
            onChange={(event) => set('market_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {markets.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Property type
          <select
            value={values.property_type_id}
            onChange={(event) => set('property_type_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {propertyTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Deal type
          <select
            value={values.deal_type_id}
            onChange={(event) => set('deal_type_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {dealTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Lead source
          <select
            value={values.lead_source_id}
            onChange={(event) => set('lead_source_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {leadSources.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        {mode === 'edit' && (
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              value={values.status_id}
              onChange={(event) => set('status_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              {dealStatuses.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Contract price
          <input
            type="number"
            step="0.01"
            value={values.contract_price}
            onChange={(event) => set('contract_price', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Projected sales price
          <input
            type="number"
            step="0.01"
            value={values.projected_sales_price}
            onChange={(event) => set('projected_sales_price', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contract date
          <input
            type="date"
            value={values.contract_date}
            onChange={(event) => set('contract_date', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Closing date
          <input
            type="date"
            value={values.closing_date}
            onChange={(event) => set('closing_date', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Due diligence expiration
          <input
            type="date"
            value={values.due_diligence_expiration}
            onChange={(event) => set('due_diligence_expiration', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        {mode === 'edit' && (
          <label className="flex flex-col gap-1 text-sm">
            Actual closing date
            <input
              type="date"
              value={values.actual_closing_date}
              onChange={(event) => set('actual_closing_date', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : mode === 'create' ? 'Create deal' : 'Save changes'}
      </button>
    </form>
  )
}
