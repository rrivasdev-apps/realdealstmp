'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function PartnerCompanyDeleteButton({ partnerCompanyId }: { partnerCompanyId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this company? This cannot be undone.')) {
      return
    }

    setError(null)
    setDeleting(true)

    const response = await fetch(`/api/partner-companies/${partnerCompanyId}`, { method: 'DELETE' })

    setDeleting(false)

    if (!response.ok) {
      const result = await response.json()
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/partner-companies')
    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="rounded bg-danger px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
