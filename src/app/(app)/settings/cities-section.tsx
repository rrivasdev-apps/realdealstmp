'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

import { ListImportForm } from '@/components/list-import-form'

type Country = { id: string; name: string; iso_code: string }
type State = { id: string; name: string; code: string | null }
type City = { id: string; name: string }

// Client component, same reason as StatesSection -- plus a US company can have
// several thousand seeded cities, so this can't render a full always-on list like
// Markets does (would bloat the page). Search-driven instead, same debounced-query
// pattern as the deal-form's city combobox and the Places autocomplete dropdown.
export function CitiesSection({ countries, defaultCountryId }: { countries: Country[]; defaultCountryId: string | null }) {
  const t = useTranslations('Settings')
  const router = useRouter()
  const [countryId, setCountryId] = useState(defaultCountryId ?? countries[0]?.id ?? '')
  const [states, setStates] = useState<State[]>([])
  const [statesLoading, setStatesLoading] = useState(false)
  const [stateId, setStateId] = useState('')

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<City[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Deferred a microtask via Promise.resolve().then() so the reset/loading setState
    // calls aren't synchronous within the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(async () => {
      setStateId('')
      setResults([])
      setStates([])
      if (!countryId) return
      setStatesLoading(true)
      try {
        const response = await fetch(`/api/states?country_id=${encodeURIComponent(countryId)}`)
        const data = response.ok ? await response.json() : []
        if (!cancelled) setStates(data)
      } finally {
        if (!cancelled) setStatesLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [countryId])

  function runSearch(forStateId: string, forQuery: string) {
    if (!forStateId) {
      setResults([])
      return
    }
    setSearching(true)
    const params = new URLSearchParams({ state_id: forStateId })
    if (forQuery.trim()) params.set('q', forQuery.trim())
    fetch(`/api/cities?${params.toString()}`)
      .then((response) => (response.ok ? response.json() : []))
      .then(setResults)
      .finally(() => setSearching(false))
  }

  useEffect(() => {
    // Deferred a microtask so runSearch's setState calls aren't synchronous within
    // the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(() => runSearch(stateId, query))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateId])

  function handleQueryChange(next: string) {
    setQuery(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(stateId, next), 300)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError(t('nameRequiredError'))
      return
    }

    setSubmitting(true)

    const response = await fetch('/api/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, state_id: stateId }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    setName('')
    runSearch(stateId, query)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="field-label">
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
        <label className="field-label">
          {t('stateLabel')}
          <select
            value={stateId}
            onChange={(event) => setStateId(event.target.value)}
            disabled={!countryId}
            className="field-input px-3 py-2 disabled:opacity-50"
          >
            <option value="">{statesLoading ? t('loadingLabel') : t('selectPlaceholder')}</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="flex max-w-md flex-col items-stretch gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 field-label">
          {t('addCityLabel')}
          <input
            type="text"
            required
            disabled={!stateId}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('cityPlaceholder')}
            className="field-input px-3 py-2 disabled:opacity-50"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !stateId}
          className="btn-primary"
        >
          {submitting ? t('addingButton') : t('addButton')}
        </button>
      </form>
      {error && <p className="text-sm text-danger">{error}</p>}

      {stateId && (
        <div className="max-w-md">
          <ListImportForm
            endpoint="/api/cities/import"
            extraBody={{ state_id: stateId }}
            placeholder={t('citiesImportPlaceholder')}
            hint={t('citiesImportHint')}
            onImported={() => runSearch(stateId, query)}
          />
        </div>
      )}

      {stateId && (
        <label className="max-w-md field-label">
          {t('searchCitiesLabel')}
          <input
            type="text"
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder={t('searchCitiesPlaceholder')}
            className="field-input px-3 py-2"
          />
        </label>
      )}

      <ul className="max-w-md divide-y divide-border">
        {!stateId && <li className="py-2 text-sm text-muted-foreground">{t('chooseStateFirst')}</li>}
        {stateId && searching && <li className="py-2 text-sm text-muted-foreground">{t('searchingLabel')}</li>}
        {stateId &&
          !searching &&
          results.map((city) => (
            <li key={city.id} className="py-2 text-sm">
              {city.name}
            </li>
          ))}
        {stateId && !searching && results.length === 0 && (
          <li className="py-2 text-sm text-muted-foreground">
            {query.trim() ? t('noMatchingCities') : t('noCitiesYetAddOne')}
          </li>
        )}
      </ul>
    </div>
  )
}
