'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Generic "add a named row" form -- same shape as EmployeeRoleForm/
// ChecklistItemForm/InvestorLlcForm, factored out now that a fourth and
// fifth near-identical copy (the Cancelled-AB/Cancelled-BC-AC/On Hold reason
// lists) would make three-plus real duplicates instead of a coincidence.
export function SimpleListForm({ endpoint, placeholder }: { endpoint: string; placeholder?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={placeholder}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
