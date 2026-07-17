'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CurrencyInput } from '@/components/currency-input'

type LookupOption = { id: string; name: string }

export type OfferFormValues = {
  id?: string
  dealId: string
  offer_price: string
  offer_date: string
  status_id: string
  inspection_deadline: string
  closing_deadline: string
  emd_deadline: string
  purchase_type_id: string
  realtor_contact_id: string
  investor_contact_id: string
  notes: string
}

export function OfferForm({
  mode,
  initialValues,
  offerStatuses,
  purchaseTypes,
  realtorContacts,
  investorContacts,
}: {
  mode: 'create' | 'edit'
  initialValues: OfferFormValues
  offerStatuses: LookupOption[]
  purchaseTypes: LookupOption[]
  realtorContacts: LookupOption[]
  investorContacts: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof OfferFormValues>(key: K, value: OfferFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url =
      mode === 'create' ? `/api/deals/${values.dealId}/offers` : `/api/deals/${values.dealId}/offers/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const payload = {
      offer_price: values.offer_price ? Number(values.offer_price) : null,
      offer_date: values.offer_date || null,
      status_id: values.status_id || undefined,
      inspection_deadline: values.inspection_deadline || null,
      closing_deadline: values.closing_deadline || null,
      emd_deadline: values.emd_deadline || null,
      purchase_type_id: values.purchase_type_id || null,
      realtor_contact_id: values.realtor_contact_id || null,
      investor_contact_id: values.investor_contact_id || null,
      notes: values.notes || null,
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

    router.push(`/deals/${values.dealId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Offer price
          <CurrencyInput
            value={values.offer_price}
            onChange={(value) => set('offer_price', value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Offer date
          <input
            type="date"
            value={values.offer_date}
            onChange={(event) => set('offer_date', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Status
          <select
            value={values.status_id}
            onChange={(event) => set('status_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            {offerStatuses.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Purchase type
          <select
            value={values.purchase_type_id}
            onChange={(event) => set('purchase_type_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {purchaseTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Inspection deadline
          <input
            type="date"
            value={values.inspection_deadline}
            onChange={(event) => set('inspection_deadline', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Closing deadline
          <input
            type="date"
            value={values.closing_deadline}
            onChange={(event) => set('closing_deadline', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          EMD deadline
          <input
            type="date"
            value={values.emd_deadline}
            onChange={(event) => set('emd_deadline', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Realtor
          <select
            value={values.realtor_contact_id}
            onChange={(event) => set('realtor_contact_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {realtorContacts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Investor
          <select
            value={values.investor_contact_id}
            onChange={(event) => set('investor_contact_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {investorContacts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          value={values.notes}
          onChange={(event) => set('notes', event.target.value)}
          rows={3}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create offer' : 'Save changes'}
        </button>
        <Link href={`/deals/${values.dealId}`} className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
