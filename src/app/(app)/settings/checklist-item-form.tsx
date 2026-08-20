'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ChecklistItemForm() {
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

    const response = await fetch('/api/checklist-items', {
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
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <label className="flex-1 field-label">
        {t('nameLabel')}
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('checklistItemNamePlaceholder')}
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
