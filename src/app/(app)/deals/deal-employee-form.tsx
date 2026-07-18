'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export function DealEmployeeForm({ dealId, availableProfiles }: { dealId: string; availableProfiles: LookupOption[] }) {
  const router = useRouter()
  const [profileId, setProfileId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!profileId) return
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/deals/${dealId}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setProfileId('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <label className="flex flex-1 flex-col gap-1 text-sm">
        Employee
        <select
          value={profileId}
          onChange={(event) => setProfileId(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          <option value="">Select a team member…</option>
          {availableProfiles.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting || !profileId}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
