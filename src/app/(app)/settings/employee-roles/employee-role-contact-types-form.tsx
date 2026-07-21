'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

// Which ContactHub contact types this role's members can see. Schema/UI
// only for now -- doesn't yet filter Contact Hub itself (see the migration
// comment on employee_role_contact_types).
export function EmployeeRoleContactTypesForm({
  employeeRoleId,
  initialContactTypeIds,
  contactTypes,
}: {
  employeeRoleId: string
  initialContactTypeIds: string[]
  contactTypes: LookupOption[]
}) {
  const router = useRouter()
  const [contactTypeIds, setContactTypeIds] = useState<string[]>(initialContactTypeIds)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setContactTypeIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/employee-roles/${employeeRoleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_type_ids: contactTypeIds }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="px-1 text-sm font-medium">Contact Hub visibility</legend>
        {contactTypes.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={contactTypeIds.includes(option.id)} onChange={() => toggle(option.id)} />
            {option.name}
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save contact types'}
      </button>
    </form>
  )
}
