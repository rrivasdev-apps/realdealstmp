'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BASIS_LABELS: Record<string, string> = {
  contract_price: 'Contract price',
  gross_profit: 'Gross profit',
  current_selling_price: 'Current selling price',
}

export function CommissionTypeForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<'flat' | 'percentage'>('flat')
  const [basis, setBasis] = useState('contract_price')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/commission-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description || null,
        category,
        basis: category === 'percentage' ? basis : null,
        value: value ? Number(value) : null,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setName('')
    setDescription('')
    setValue('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Closer commission"
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as 'flat' | 'percentage')}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="flat">Flat fee</option>
            <option value="percentage">Percentage</option>
          </select>
        </label>

        {category === 'percentage' && (
          <label className="flex flex-col gap-1 text-sm">
            Basis
            <select
              value={basis}
              onChange={(event) => setBasis(event.target.value)}
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

        <label className="flex flex-col gap-1 text-sm">
          {category === 'flat' ? 'Amount' : 'Percent'}
          <input
            type="number"
            step="0.01"
            required
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Description
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={2}
          placeholder="Use case, who this applies to, why it exists"
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add commission type'}
      </button>
    </form>
  )
}
