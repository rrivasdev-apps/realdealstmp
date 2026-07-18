'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function InvestorLlcForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/investor-llcs', {
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
          placeholder="Investor or LLC name"
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
