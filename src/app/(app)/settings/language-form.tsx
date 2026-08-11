'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { type Locale, locales } from '@/i18n/config'

// Each language is named in itself, not in the current UI language -- someone who
// lands in a language they don't read still has to be able to find their way out.
const LANGUAGE_LABELS: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

export function LanguageForm({ locale }: { locale: Locale }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [selected, setSelected] = useState<Locale>(locale)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setSubmitting(true)

    const response = await fetch('/api/companies/locale', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: selected }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setStatus(t('savedStatus'))
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-sm flex-col items-stretch gap-3 sm:flex-row sm:items-end">
      <label className="flex-1 field-label">
        {t('languageLabel')}
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value as Locale)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          {locales.map((option) => (
            <option key={option} value={option}>
              {LANGUAGE_LABELS[option]}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting || selected === locale}
        className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('savingButton') : t('saveButton')}
      </button>
      {status && <p className="text-sm text-success">{status}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
