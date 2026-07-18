'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export function EmployeeForm({
  profileId,
  initialEmployeeRoleId,
  initialCommissionTypeIds,
  employeeRoles,
  commissionTypes,
}: {
  profileId: string
  initialEmployeeRoleId: string
  initialCommissionTypeIds: string[]
  employeeRoles: LookupOption[]
  commissionTypes: LookupOption[]
}) {
  const router = useRouter()
  const [employeeRoleId, setEmployeeRoleId] = useState(initialEmployeeRoleId)
  const [commissionTypeIds, setCommissionTypeIds] = useState<string[]>(initialCommissionTypeIds)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleCommissionType(id: string) {
    setCommissionTypeIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/team/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_role_id: employeeRoleId || null, commission_type_ids: commissionTypeIds }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/team')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Employee role
        <select
          value={employeeRoleId}
          onChange={(event) => setEmployeeRoleId(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          <option value="">—</option>
          {employeeRoles.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          Any commission types assigned to this role in Settings apply to this employee too.
        </span>
      </label>

      <fieldset className="flex flex-col gap-2 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Direct commission types</legend>
        {commissionTypes.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={commissionTypeIds.includes(option.id)}
              onChange={() => toggleCommissionType(option.id)}
            />
            {option.name}
          </label>
        ))}
        {commissionTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">No commission types yet — add some in Settings.</p>
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
        <Link href="/team" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
