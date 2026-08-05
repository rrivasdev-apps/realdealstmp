'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CustomFieldDefinitionForm() {
  const t = useTranslations('Settings')
  const FIELD_TYPE_LABELS: Record<string, string> = {
    text: t('fieldTypeText'),
    number: t('fieldTypeNumber'),
    date: t('fieldTypeDate'),
    checkbox: t('fieldTypeCheckbox'),
    select: t('fieldTypeSelect'),
  }
  const router = useRouter()
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [optionsText, setOptionsText] = useState('')
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

    const options = optionsText
      .split('\n')
      .map((option) => option.trim())
      .filter(Boolean)

    const response = await fetch('/api/custom-field-definitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        field_type: fieldType,
        options: fieldType === 'select' ? options : undefined,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setName('')
    setFieldType('text')
    setOptionsText('')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded border border-border p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="field-label">
          {t('nameLabel')}
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('customFieldNamePlaceholder')}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('typeLabel')}
          <select
            value={fieldType}
            onChange={(event) => setFieldType(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            {Object.entries(FIELD_TYPE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {fieldType === 'select' && (
        <label className="field-label">
          {t('optionsLabel')}
          <textarea
            value={optionsText}
            onChange={(event) => setOptionsText(event.target.value)}
            rows={3}
            placeholder={t('optionsPlaceholder')}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('addingButton') : t('addCustomFieldButton')}
      </button>
    </form>
  )
}
