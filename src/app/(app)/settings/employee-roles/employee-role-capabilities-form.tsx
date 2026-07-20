'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Capabilities = {
  can_manage_team: boolean
  can_manage_settings: boolean
  can_view_financials: boolean
}

const CAPABILITY_LABELS: Record<keyof Capabilities, string> = {
  can_manage_team: 'Manage team (invite, edit roles, pay rates)',
  can_manage_settings: 'Manage settings (lookups, commission types)',
  can_view_financials: "View the whole company's financials on the dashboard",
}

// Admin-only, same as the route this posts to -- CLAUDE.md/requirePermission
// deliberately keeps employee_roles' own capability flags off the
// can_manage_settings delegation path, since a manager could otherwise grant
// themselves every capability through their own role.
export function EmployeeRoleCapabilitiesForm({
  employeeRoleId,
  initialCapabilities,
}: {
  employeeRoleId: string
  initialCapabilities: Capabilities
}) {
  const router = useRouter()
  const [capabilities, setCapabilities] = useState(initialCapabilities)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggle(key: keyof Capabilities) {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/employee-roles/${employeeRoleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capabilities }),
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
        <legend className="px-1 text-sm font-medium">Capabilities</legend>
        {(Object.keys(CAPABILITY_LABELS) as (keyof Capabilities)[]).map((key) => (
          <label key={key} className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={capabilities[key]} onChange={() => toggle(key)} />
            {CAPABILITY_LABELS[key]}
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save capabilities'}
      </button>
    </form>
  )
}
