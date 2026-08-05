'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function CountryForm() {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [name, setName] = useState('')
  const [isoCode, setIsoCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim() || !isoCode.trim()) {
      setError(t('nameAndCodeRequiredError'))
      return
    }

    setSubmitting(true)

    const response = await fetch('/api/countries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, iso_code: isoCode }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setName('')
    setIsoCode('')
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
          placeholder={t('countryNamePlaceholder')}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>
      <label className="w-24 field-label">
        {t('codeLabel')}
        <input
          type="text"
          required
          maxLength={2}
          value={isoCode}
          onChange={(event) => setIsoCode(event.target.value.toUpperCase())}
          placeholder={t('countryCodePlaceholder')}
          className="rounded border border-input-border bg-input-background px-3 py-2 uppercase"
        />
      </label>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('addingButton') : t('addButton')}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
