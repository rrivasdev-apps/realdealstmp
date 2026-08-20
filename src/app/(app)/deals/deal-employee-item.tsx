'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type EmployeeRole = { id: string; name: string }
type Payment = { id: string; amount: number | null; status: string; commission_types: { name: string } | null }

export function DealEmployeeItem({
  dealId,
  dealEmployeeId,
  profileName,
  configuredRoles,
  currentRoleIds,
  payments,
}: {
  dealId: string
  dealEmployeeId: string
  profileName: string
  configuredRoles: EmployeeRole[]
  currentRoleIds: string[]
  payments: Payment[]
}) {
  const t = useTranslations('DealDetail')
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [selectedRoleIds, setSelectedRoleIds] = useState(currentRoleIds)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const roleNames = currentRoleIds
    .map((roleId) => configuredRoles.find((role) => role.id === roleId)?.name)
    .filter(Boolean)
    .join(', ')

  function toggleRole(id: string) {
    setSelectedRoleIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSave() {
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/deals/${dealId}/employees/${dealEmployeeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_role_ids: selectedRoleIds }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setEditing(false)
    router.refresh()
  }

  async function handleRemove() {
    if (!confirm(t('removeConfirm', { name: profileName }))) {
      return
    }

    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/deals/${dealId}/employees/${dealEmployeeId}`, { method: 'DELETE' })

    setSubmitting(false)

    if (!response.ok) {
      const result = await response.json()
      setError(result.error ?? t('genericError'))
      return
    }

    router.refresh()
  }

  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{profileName}</div>
          {!editing && (
            <div className="text-xs text-muted-foreground">{roleNames || t('noRoleSelected')}</div>
          )}
        </div>
        {!editing && (
          <div className="flex shrink-0 gap-2 text-xs">
            <button type="button" onClick={() => setEditing(true)} className="underline">
              {t('editRolesButton')}
            </button>
            <button type="button" onClick={handleRemove} disabled={submitting} className="text-danger underline disabled:opacity-50">
              {t('removeButton')}
            </button>
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-2 flex flex-col gap-2 rounded border border-border p-3 text-sm">
          {configuredRoles.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('noConfiguredRoles')}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {configuredRoles.map((role) => (
                <label key={role.id} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => toggleRole(role.id)} />
                  {role.name}
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="btn-primary px-3 py-1 text-xs"
            >
              {submitting ? t('savingButton') : t('saveButton')}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                setSelectedRoleIds(currentRoleIds)
                setError(null)
              }}
              className="rounded border border-input-border px-3 py-1 text-xs"
            >
              {t('cancelButton')}
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      {payments.length === 0 ? (
        <div className="mt-1 text-sm text-muted-foreground">{t('noCommissionsApply')}</div>
      ) : (
        <ul className="mt-1 flex flex-col gap-1">
          {payments.map((payment) => (
            <li key={payment.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{payment.commission_types?.name}</span>
              <span className="flex items-center gap-2">
                <span>{payment.amount != null ? currency.format(payment.amount) : '—'}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">{payment.status}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
