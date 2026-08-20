'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Country = { id: string; name: string; iso_code: string }

export function DefaultCountryForm({ countries, defaultCountryId }: { countries: Country[]; defaultCountryId: string | null }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [countryId, setCountryId] = useState(defaultCountryId ?? '')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setSubmitting(true)

    const response = await fetch('/api/companies/default-country', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country_id: countryId }),
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
        {t('defaultCountryLabel')}
        <select
          value={countryId}
          onChange={(event) => setCountryId(event.target.value)}
          className="field-input px-3 py-2"
        >
          <option value="" disabled>
            {t('selectPlaceholder')}
          </option>
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={submitting || !countryId}
        className="btn-primary"
      >
        {submitting ? t('savingButton') : t('saveButton')}
      </button>
      {status && <p className="text-sm text-success">{status}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
