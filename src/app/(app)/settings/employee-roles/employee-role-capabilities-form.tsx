'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CAPABILITY_GROUPS, CAPABILITY_LABEL_KEYS, type Capabilities } from '@/lib/employee-permissions/labels'

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
  const t = useTranslations('Settings')
  const router = useRouter()
  const [capabilities, setCapabilities] = useState(initialCapabilities)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggle(key: keyof Capabilities) {
    setCapabilities((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  async function submit(confirmed: boolean) {
    const response = await fetch(`/api/employee-roles/${employeeRoleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ capabilities, confirmed }),
    })
    const result = await response.json()

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    // The server declines to apply the change until it's confirmed, since
    // this role's capabilities act as a template that cascades down to every
    // employee currently assigned it -- overwriting their individually-tuned
    // permissions is a real, hard-to-notice side effect otherwise.
    if (result.needsConfirmation) {
      const proceed = window.confirm(t('confirmOverwriteMessage', { count: result.affectedCount }))
      if (proceed) {
        await submit(true)
      }
      return
    }

    router.refresh()
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    await submit(false)
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded border border-border p-4">
      {CAPABILITY_GROUPS.map((group) => (
        <fieldset key={group.id} className="flex flex-col gap-2">
          <legend className="px-1 text-sm font-medium">{t(group.labelKey)}</legend>
          {group.keys.map((key) => (
            <label key={key} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" checked={capabilities[key]} onChange={() => toggle(key)} />
              {t(CAPABILITY_LABEL_KEYS[key])}
            </label>
          ))}
        </fieldset>
      ))}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit btn-primary"
      >
        {submitting ? t('savingButton') : t('saveCapabilitiesButton')}
      </button>
    </form>
  )
}
