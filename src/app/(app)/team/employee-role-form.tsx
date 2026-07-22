'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Company admin's own account role ('admin' | 'member') -- distinct from
// employee_roles (the assignable job-role/capability templates). Only an
// admin ever sees this control; see src/app/api/team/[id]/role/route.ts.
export function EmployeeRoleForm({ profileId, initialRole }: { profileId: string; initialRole: 'admin' | 'member' }) {
  const router = useRouter()
  const [role, setRole] = useState(initialRole)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleChange(nextRole: 'admin' | 'member') {
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/team/${profileId}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setRole(nextRole)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-border p-4">
      <p className="text-sm font-medium">Account role</p>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="role"
            checked={role === 'admin'}
            disabled={submitting}
            onChange={() => handleChange('admin')}
          />
          Company Admin
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="role"
            checked={role === 'member'}
            disabled={submitting}
            onChange={() => handleChange('member')}
          />
          Standard
        </label>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
