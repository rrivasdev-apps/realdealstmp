'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type EmployeeRole = { id: string; name: string }
type AvailableProfile = { id: string; name: string; profile_employee_roles: { employee_roles: EmployeeRole | null }[] }

export function DealEmployeeForm({
  dealId,
  availableProfiles,
}: {
  dealId: string
  availableProfiles: AvailableProfile[]
}) {
  const router = useRouter()
  const [profileId, setProfileId] = useState('')
  const [employeeRoleIds, setEmployeeRoleIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const selectedProfile = availableProfiles.find((option) => option.id === profileId)
  const selectableRoles = (selectedProfile?.profile_employee_roles ?? [])
    .map((assignment) => assignment.employee_roles)
    .filter((role): role is EmployeeRole => role != null)

  function toggleEmployeeRole(id: string) {
    setEmployeeRoleIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!profileId) return
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/deals/${dealId}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, employee_role_ids: employeeRoleIds }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setProfileId('')
    setEmployeeRoleIds([])
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex items-end gap-3">
        <label className="flex-1 field-label">
          Employee
          <select
            value={profileId}
            onChange={(event) => {
              setProfileId(event.target.value)
              setEmployeeRoleIds([])
            }}
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
      </div>

      {profileId && (
        <fieldset className="flex flex-col gap-2 rounded border border-border p-3 text-sm">
          <legend className="px-1 text-xs font-medium text-muted-foreground">
            Role(s) on this deal
          </legend>
          {selectableRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              This team member has no roles configured on their profile yet — set those up in Settings &gt; Employee
              Center first.
            </p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {selectableRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={employeeRoleIds.includes(role.id)}
                    onChange={() => toggleEmployeeRole(role.id)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          )}
        </fieldset>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
