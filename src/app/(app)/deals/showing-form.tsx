'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export type ShowingFormValues = {
  id?: string
  dealId: string
  showing_date: string
  status_id: string
  buyer_contact_id: string
  vendor_contact_id: string
  details: string
}

export function ShowingForm({
  mode,
  initialValues,
  showingStatuses,
  buyerContacts,
  vendorContacts,
}: {
  mode: 'create' | 'edit'
  initialValues: ShowingFormValues
  showingStatuses: LookupOption[]
  buyerContacts: LookupOption[]
  vendorContacts: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof ShowingFormValues>(key: K, value: ShowingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url =
      mode === 'create'
        ? `/api/deals/${values.dealId}/showings`
        : `/api/deals/${values.dealId}/showings/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const payload = {
      showing_date: values.showing_date || null,
      status_id: values.status_id || undefined,
      buyer_contact_id: values.buyer_contact_id || null,
      vendor_contact_id: values.vendor_contact_id || null,
      details: values.details || null,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Showing date
          <input
            type="date"
            value={values.showing_date}
            onChange={(event) => set('showing_date', event.target.value)}
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
            {showingStatuses.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Buyer contact
          <select
            value={values.buyer_contact_id}
            onChange={(event) => set('buyer_contact_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {buyerContacts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Vendor contact
          <select
            value={values.vendor_contact_id}
            onChange={(event) => set('vendor_contact_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {vendorContacts.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Details
        <textarea
          value={values.details}
          onChange={(event) => set('details', event.target.value)}
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
          {submitting ? 'Saving…' : mode === 'create' ? 'Create showing' : 'Save changes'}
        </button>
        <Link href={`/deals/${values.dealId}`} className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
