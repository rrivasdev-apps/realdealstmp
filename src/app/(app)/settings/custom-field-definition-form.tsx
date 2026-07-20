'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  checkbox: 'Checkbox',
  select: 'Dropdown',
}

export function CustomFieldDefinitionForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [fieldType, setFieldType] = useState('text')
  const [optionsText, setOptionsText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
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
      setError(result.error ?? 'Something went wrong.')
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
        <label className="flex flex-col gap-1 text-sm">
          Name
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. HOA Name"
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Type
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
        <label className="flex flex-col gap-1 text-sm">
          Options (one per line)
          <textarea
            value={optionsText}
            onChange={(event) => setOptionsText(event.target.value)}
            rows={3}
            placeholder={'Option A\nOption B'}
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
        {submitting ? 'Adding…' : 'Add custom field'}
      </button>
    </form>
  )
}
