'use client'

import { useState } from 'react'

import { CurrencyInput } from '@/components/currency-input'

type LookupOption = { id: string; name: string }

export type Listing = {
  id: string
  address: string
  list_price: number | null
  status_id: string | null
  statusName: string | null
  listing_date: string | null
  notes: string | null
}

type ListingFormState = {
  address: string
  list_price: string
  status_id: string
  listing_date: string
  notes: string
}

const EMPTY_FORM: ListingFormState = { address: '', list_price: '', status_id: '', listing_date: '', notes: '' }

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// "Listings (Realtor): listings tied to this realtor, with an Add Listing
// button" -- docs/reference/contact-hub.md gives no further field detail, so
// this is deliberately minimal (address/price/status/date/notes). Persists
// immediately on Save (not deferred to the parent contact form's Save
// changes), same as Offers are managed independently of the deal form.
export function ListingsPanel({
  contactId,
  initialListings,
  listingStatuses,
}: {
  contactId: string | null
  initialListings: Listing[]
  listingStatuses: LookupOption[]
}) {
  const [listings, setListings] = useState(initialListings)
  const [editingId, setEditingId] = useState<string | 'new' | null>(null)
  const [form, setForm] = useState<ListingFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startAdd() {
    setEditingId('new')
    setForm(EMPTY_FORM)
    setError(null)
  }

  function startEdit(listing: Listing) {
    setEditingId(listing.id)
    setForm({
      address: listing.address,
      list_price: listing.list_price?.toString() ?? '',
      status_id: listing.status_id ?? '',
      listing_date: listing.listing_date ?? '',
      notes: listing.notes ?? '',
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSave() {
    if (!contactId) return
    if (!form.address.trim()) {
      setError('Address is required.')
      return
    }
    setSubmitting(true)
    setError(null)

    const isNew = editingId === 'new'
    const url = isNew ? `/api/contacts/${contactId}/listings` : `/api/contacts/${contactId}/listings/${editingId}`
    const response = await fetch(url, {
      method: isNew ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: form.address,
        list_price: form.list_price ? Number(form.list_price) : null,
        status_id: form.status_id || null,
        listing_date: form.listing_date || null,
        notes: form.notes || null,
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Could not save this listing.')
      return
    }

    const statusName = listingStatuses.find((option) => option.id === form.status_id)?.name ?? null
    const savedListing: Listing = {
      id: isNew ? result.id : (editingId as string),
      address: form.address,
      list_price: form.list_price ? Number(form.list_price) : null,
      status_id: form.status_id || null,
      statusName,
      listing_date: form.listing_date || null,
      notes: form.notes || null,
    }

    setListings((prev) =>
      isNew ? [...prev, savedListing] : prev.map((listing) => (listing.id === editingId ? savedListing : listing))
    )
    cancelEdit()
  }

  async function handleDelete(id: string) {
    if (!contactId) return
    const response = await fetch(`/api/contacts/${contactId}/listings/${id}`, { method: 'DELETE' })
    if (!response.ok) return
    setListings((prev) => prev.filter((listing) => listing.id !== id))
    if (editingId === id) cancelEdit()
  }

  if (!contactId) {
    return <p className="text-sm text-muted-foreground">Save this contact first to add listings.</p>
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">Listings</span>
        {editingId === null && (
          <button type="button" onClick={startAdd} className="text-xs underline">
            + Add Listing
          </button>
        )}
      </div>

      {listings.length === 0 && editingId === null && (
        <p className="text-xs text-muted-foreground">No listings yet.</p>
      )}

      <ul className="flex flex-col gap-1">
        {listings.map((listing) =>
          editingId === listing.id ? (
            <li key={listing.id} className="rounded border border-border p-2">
              <ListingForm
                form={form}
                setForm={setForm}
                listingStatuses={listingStatuses}
                onSave={handleSave}
                onCancel={cancelEdit}
                submitting={submitting}
                error={error}
              />
            </li>
          ) : (
            <li key={listing.id} className="flex items-center justify-between rounded border border-border px-2 py-1.5">
              <div>
                <div className="font-medium">{listing.address}</div>
                <div className="text-xs text-muted-foreground">
                  {[listing.list_price != null ? currency.format(listing.list_price) : null, listing.statusName]
                    .filter(Boolean)
                    .join(' · ') || 'No details yet'}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => startEdit(listing)} className="text-xs underline">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(listing.id)} className="text-xs text-danger">
                  Remove
                </button>
              </div>
            </li>
          )
        )}
        {editingId === 'new' && (
          <li className="rounded border border-border p-2">
            <ListingForm
              form={form}
              setForm={setForm}
              listingStatuses={listingStatuses}
              onSave={handleSave}
              onCancel={cancelEdit}
              submitting={submitting}
              error={error}
            />
          </li>
        )}
      </ul>
    </div>
  )
}

function ListingForm({
  form,
  setForm,
  listingStatuses,
  onSave,
  onCancel,
  submitting,
  error,
}: {
  form: ListingFormState
  setForm: React.Dispatch<React.SetStateAction<ListingFormState>>
  listingStatuses: LookupOption[]
  onSave: () => void
  onCancel: () => void
  submitting: boolean
  error: string | null
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label className="field-label">
        Address
        <input
          type="text"
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-2 py-1"
        />
      </label>
      <label className="field-label">
        List price
        <CurrencyInput
          value={form.list_price}
          onChange={(value) => setForm((prev) => ({ ...prev, list_price: value }))}
          className="rounded border border-input-border bg-input-background px-2 py-1"
        />
      </label>
      <label className="field-label">
        Status
        <select
          value={form.status_id}
          onChange={(event) => setForm((prev) => ({ ...prev, status_id: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-2 py-1"
        >
          <option value="">—</option>
          {listingStatuses.map((status) => (
            <option key={status.id} value={status.id}>
              {status.name}
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        Listing date
        <input
          type="date"
          value={form.listing_date}
          onChange={(event) => setForm((prev) => ({ ...prev, listing_date: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-2 py-1"
        />
      </label>
      <label className="field-label">
        Notes
        <textarea
          value={form.notes}
          onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
          rows={2}
          className="rounded border border-input-border bg-input-background px-2 py-1"
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={submitting}
          className="rounded bg-foreground px-3 py-1 text-xs text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground underline">
          Cancel
        </button>
      </div>
    </div>
  )
}
