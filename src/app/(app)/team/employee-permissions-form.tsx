'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CAPABILITY_GROUPS, CAPABILITY_LABELS, type Capabilities } from '@/lib/employee-permissions/labels'

// Direct override of one employee's own permission snapshot -- independent
// of whatever role(s) they hold (assigning/removing a role, or a role
// template edit that cascades, will recompute over this). See
// src/app/api/team/[id]/permissions/route.ts.
export function EmployeePermissionsForm({
  profileId,
  initialCapabilities,
}: {
  profileId: string
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

    const response = await fetch(`/api/team/${profileId}/permissions`, {
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded border border-border p-4">
      <p className="text-xs text-muted-foreground">
        This employee&apos;s own permissions. Assigning a role above resets these to that role&apos;s (combined)
        settings -- editing them here overrides that until their roles change again.
      </p>
      {CAPABILITY_GROUPS.map((group) => (
        <fieldset key={group.label} className="flex flex-col gap-2">
          <legend className="px-1 text-sm font-medium">{group.label}</legend>
          {group.keys.map((key) => (
            <label key={key} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={capabilities[key]} onChange={() => toggle(key)} />
              {CAPABILITY_LABELS[key]}
            </label>
          ))}
        </fieldset>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save permissions'}
      </button>
    </form>
  )
}
