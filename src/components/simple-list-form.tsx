'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Generic "add a named row" form -- same shape as EmployeeRoleForm/
// ChecklistItemForm/InvestorLlcForm, factored out now that a fourth and
// fifth near-identical copy (the Cancelled-AB/Cancelled-BC-AC/On Hold reason
// lists) would make three-plus real duplicates instead of a coincidence.
// Settings-only, so it reaches into the Settings message namespace directly
// rather than taking translated strings as props.
export function SimpleListForm({ endpoint, placeholder }: { endpoint: string; placeholder?: string }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(t('nameRequiredError'))
      return
    }

    setSubmitting(true)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setName('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 field-label">
        {t('nameLabel')}
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={placeholder}
          className="field-input px-3 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="btn-primary"
      >
        {submitting ? t('addingButton') : t('addButton')}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
