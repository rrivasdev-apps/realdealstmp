'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// "Delete" here is a hide, not a destroy -- the employee keeps every payment,
// commission and deal assignment, and can be restored from the Deleted view.
// The confirm copy says so, because "Delete" on its own reads as permanent.
export function EmployeeStatusButton({
  profileId,
  name,
  deleted,
}: {
  profileId: string
  name: string
  deleted: boolean
}) {
  const t = useTranslations('Team')
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (!deleted && !window.confirm(t('deleteConfirm', { name }))) {
      return
    }

    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/team/${profileId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleted: !deleted }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
      >
        {submitting ? t('savingButton') : deleted ? t('restoreButton') : t('deleteButton')}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
