'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ListImportForm } from '@/components/list-import-form'

type Country = { id: string; name: string; iso_code: string }
type State = { id: string; name: string; code: string | null }

// Client component (unlike Markets/Deal Types) because the list is filtered by a
// Country selector -- States only makes sense scoped to one country at a time, and
// switching countries needs a live re-fetch rather than a full page reload.
export function StatesSection({ countries, defaultCountryId }: { countries: Country[]; defaultCountryId: string | null }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [countryId, setCountryId] = useState(defaultCountryId ?? countries[0]?.id ?? '')
  const [states, setStates] = useState<State[]>([])
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Deferred a microtask via Promise.resolve().then() so the reset/loading setState
    // calls aren't synchronous within the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(async () => {
      setStates([])
      if (!countryId) return
      setLoading(true)
      try {
        const response = await fetch(`/api/states?country_id=${encodeURIComponent(countryId)}`)
        const data = response.ok ? await response.json() : []
        if (!cancelled) setStates(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [countryId])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(t('nameRequiredError'))
      return
    }

    setSubmitting(true)

    const response = await fetch('/api/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, country_id: countryId }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setName('')
    setCode('')
    setStates((prev) => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)))
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="max-w-xs field-label">
        {t('countryLabel')}
        <select
          value={countryId}
          onChange={(event) => setCountryId(event.target.value)}
          className="field-input px-3 py-2"
        >
          {countries.length === 0 && <option value="">{t('noCountriesYetOption')}</option>}
          {countries.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={handleSubmit} className="flex max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 field-label">
          {t('nameLabel')}
          <input
            type="text"
            required
            disabled={!countryId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('stateNamePlaceholder')}
            className="field-input px-3 py-2 disabled:opacity-50"
          />
        </label>
        <label className="w-20 field-label">
          {t('codeLabel')}
          <input
            type="text"
            disabled={!countryId}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t('stateCodePlaceholder')}
            className="field-input px-3 py-2 uppercase disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !countryId}
          className="btn-primary"
        >
          {submitting ? t('addingButton') : t('addButton')}
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      {countryId && (
        <div className="max-w-md">
          <ListImportForm
            endpoint="/api/states/import"
            extraBody={{ country_id: countryId }}
            placeholder={t('statesImportPlaceholder')}
            hint={t('statesImportHint')}
            onImported={() => {
              fetch(`/api/states?country_id=${encodeURIComponent(countryId)}`)
                .then((response) => (response.ok ? response.json() : []))
                .then(setStates)
            }}
          />
        </div>
      )}

      <ul className="max-w-md divide-y divide-border">
        {loading && <li className="py-2 text-sm text-muted-foreground">{t('loadingLabel')}</li>}
        {!loading &&
          states.map((state) => (
            <li key={state.id} className="py-2 text-sm">
              {state.name}
              {state.code && <span className="ml-2 text-xs text-muted-foreground">{state.code}</span>}
            </li>
          ))}
        {!loading && states.length === 0 && <li className="py-2 text-sm text-muted-foreground">{t('noStatesYet')}</li>}
      </ul>
    </div>
  )
}
