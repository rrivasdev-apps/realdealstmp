'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Just creates a bare automation and opens the builder -- naming and every
// other setting happens there as a second step, not up front in a form here.
// An optional folderId pre-files the new automation when this button is
// rendered inside a specific folder/subfolder's section.
export function NewAutomationButton({ folderId, label = 'New' }: { folderId?: string; label?: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleClick() {
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId ?? null }),
    })
    const result = await response.json()

    if (!response.ok) {
      setSubmitting(false)
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push(`/settings/automations/${result.id}`)
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Creating…' : label}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
