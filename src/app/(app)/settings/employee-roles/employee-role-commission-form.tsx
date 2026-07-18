'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export function EmployeeRoleCommissionForm({
  employeeRoleId,
  initialCommissionTypeIds,
  commissionTypes,
}: {
  employeeRoleId: string
  initialCommissionTypeIds: string[]
  commissionTypes: LookupOption[]
}) {
  const router = useRouter()
  const [commissionTypeIds, setCommissionTypeIds] = useState<string[]>(initialCommissionTypeIds)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setCommissionTypeIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/employee-roles/${employeeRoleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commission_type_ids: commissionTypeIds }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/settings')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <fieldset className="flex flex-col gap-2 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Commission types</legend>
        {commissionTypes.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={commissionTypeIds.includes(option.id)} onChange={() => toggle(option.id)} />
            {option.name}
          </label>
        ))}
        {commissionTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">No commission types yet — add some above.</p>
        )}
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <Link href="/settings" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
