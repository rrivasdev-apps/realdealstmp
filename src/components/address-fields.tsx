'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export type AddressValue = {
  address: string
  countryId: string
  countryName: string
  stateId: string
  stateName: string
  cityId: string
  cityName: string
  zipCode: string
}

export type CountryOption = { id: string; name: string; iso_code: string }
type StateOption = { id: string; name: string; code: string | null }
type CityOption = { id: string; name: string }
type Prediction = { placeId: string; text: string }

// Street-address input with an optional Google Places autocomplete dropdown, plus
// Country/State dropdowns and a searchable City combobox. Country/State/City are FK
// dropdowns into the company's own geography lists (src/lib/geography) rather than
// free text, so "Texas"/"TX"/"texas" can't become three different values -- see the
// deal-geography migration. Works identically whether GOOGLE_MAPS_API_KEY is
// configured or not -- when it isn't (or a given address has no match), predictions
// simply never appear and the three dropdowns stay plain manual selection.
export function AddressFields({
  value,
  onChange,
  countries,
}: {
  value: AddressValue
  onChange: (value: AddressValue) => void
  countries: CountryOption[]
}) {
  const t = useTranslations('Common')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [states, setStates] = useState<StateOption[]>([])
  const [statesLoading, setStatesLoading] = useState(false)

  const [cityResults, setCityResults] = useState<CityOption[]>([])
  const [showCityResults, setShowCityResults] = useState(false)
  const cityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Read by the blur handler below, which runs on a timer after a suggestion
  // click may already have updated either one -- its own closure would be stale.
  const latestValueRef = useRef(value)
  const latestCityResultsRef = useRef(cityResults)
  useEffect(() => {
    latestValueRef.current = value
    latestCityResultsRef.current = cityResults
  }, [value, cityResults])

  useEffect(() => {
    let cancelled = false
    // Deferred a microtask via Promise.resolve().then() so the reset/loading setState
    // calls aren't synchronous within the effect body itself (react-hooks/set-state-in-effect).
    Promise.resolve().then(async () => {
      setStates([])
      if (!value.countryId) return
      setStatesLoading(true)
      try {
        const response = await fetch(`/api/states?country_id=${encodeURIComponent(value.countryId)}`)
        const data = response.ok ? await response.json() : []
        if (!cancelled) setStates(data)
      } finally {
        if (!cancelled) setStatesLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [value.countryId])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    }
  }, [])

  function handleAddressChange(address: string) {
    onChange({ ...value, address })
    setShowPredictions(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!address.trim()) {
      setPredictions([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(address)}`)
      if (!response.ok) {
        setPredictions([])
        return
      }
      const result = await response.json()
      setPredictions(result.configured ? result.predictions : [])
    }, 300)
  }

  async function handlePick(prediction: Prediction) {
    setShowPredictions(false)
    setPredictions([])
    onChange({ ...value, address: prediction.text })

    const response = await fetch(`/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`)
    if (!response.ok) return
    const result = await response.json()
    if (!result.configured) return

    onChange({
      address: result.address ?? prediction.text,
      countryId: result.country_id ?? '',
      countryName: result.country_name ?? '',
      stateId: result.state_id ?? '',
      stateName: result.state_name ?? '',
      cityId: result.city_id ?? '',
      cityName: result.city_name ?? '',
      zipCode: result.zip_code ?? '',
    })
  }

  function handleCountryChange(countryId: string) {
    const country = countries.find((option) => option.id === countryId)
    onChange({ ...value, countryId, countryName: country?.name ?? '', stateId: '', stateName: '', cityId: '', cityName: '' })
  }

  function handleStateChange(stateId: string) {
    const state = states.find((option) => option.id === stateId)
    onChange({ ...value, stateId, stateName: state?.name ?? '', cityId: '', cityName: '' })
  }

  function handleCityQueryChange(query: string) {
    onChange({ ...value, cityId: '', cityName: query })
    setShowCityResults(true)

    if (cityDebounceRef.current) clearTimeout(cityDebounceRef.current)
    if (!value.stateId || !query.trim()) {
      setCityResults([])
      return
    }
    cityDebounceRef.current = setTimeout(async () => {
      const response = await fetch(`/api/cities?state_id=${encodeURIComponent(value.stateId)}&q=${encodeURIComponent(query)}`)
      setCityResults(response.ok ? await response.json() : [])
    }, 300)
  }

  function handleCityPick(city: CityOption) {
    setShowCityResults(false)
    setCityResults([])
    onChange({ ...value, cityId: city.id, cityName: city.name })
  }

  // City is a lookup, not free text: cityId is cleared on every keystroke and only
  // set again by picking a suggestion. Typing a real city and tabbing away used to
  // save the record with no city at all, silently -- the input still showed the
  // typed name, so nothing hinted the value had been dropped. Resolve an exact
  // name match here, and clear anything we can't resolve so the field always shows
  // what will actually be saved. Runs on the same delay as the dropdown hide, so a
  // click on a suggestion or "add city" has already set cityId by the time it fires.
  function handleCityBlur() {
    setTimeout(() => {
      setShowCityResults(false)
      const current = latestValueRef.current
      const typed = current.cityName.trim()
      if (current.cityId || !typed) return
      const match = latestCityResultsRef.current.find(
        (city) => city.name.toLowerCase() === typed.toLowerCase()
      )
      onChange({ ...current, cityId: match?.id ?? '', cityName: match?.name ?? '' })
    }, 150)
  }

  async function handleCreateCity() {
    const name = value.cityName.trim()
    if (!value.stateId || !name) return
    const response = await fetch('/api/cities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, state_id: value.stateId }),
    })
    if (!response.ok) return
    handleCityPick(await response.json())
  }

  const trimmedCityQuery = value.cityName.trim()
  const exactCityMatch = cityResults.some((city) => city.name.toLowerCase() === trimmedCityQuery.toLowerCase())

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label className="field-label">
          {t('addressLabel')}
          <input
            type="text"
            required
            value={value.address}
            onChange={(event) => handleAddressChange(event.target.value)}
            onFocus={() => setShowPredictions(true)}
            onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
            autoComplete="off"
            className="field-input px-3 py-2"
          />
        </label>
        {showPredictions && predictions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-border bg-background shadow-lg">
            {predictions.map((prediction) => (
              <li key={prediction.placeId}>
                <button
                  type="button"
                  onClick={() => handlePick(prediction)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {prediction.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="field-label">
          {t('countryLabel')}
          <select
            value={value.countryId}
            onChange={(event) => handleCountryChange(event.target.value)}
            className="field-input px-3 py-2"
          >
            <option value="">{t('selectPlaceholder')}</option>
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
            value={value.stateId}
            onChange={(event) => handleStateChange(event.target.value)}
            disabled={!value.countryId}
            className="field-input px-3 py-2 disabled:opacity-50"
          >
            <option value="">{statesLoading ? t('loadingPlaceholder') : t('selectPlaceholder')}</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
        <div className="relative">
          <label className="field-label">
            {t('cityLabel')}
            <input
              type="text"
              value={value.cityName}
              onChange={(event) => handleCityQueryChange(event.target.value)}
              onFocus={() => setShowCityResults(true)}
              onBlur={handleCityBlur}
              disabled={!value.stateId}
              autoComplete="off"
              className="field-input px-3 py-2 disabled:opacity-50"
            />
          </label>
          {showCityResults && value.stateId && trimmedCityQuery && (
            <ul className="absolute z-10 mt-1 w-full rounded border border-border bg-background shadow-lg">
              {cityResults.map((city) => (
                <li key={city.id}>
                  <button
                    type="button"
                    onClick={() => handleCityPick(city)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    {city.name}
                  </button>
                </li>
              ))}
              {!exactCityMatch && (
                <li>
                  <button
                    type="button"
                    onClick={handleCreateCity}
                    className="block w-full px-3 py-2 text-left text-sm text-brand-600 hover:bg-muted"
                  >
                    {t('addCityOption', { name: trimmedCityQuery })}
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="field-label">
          {t('zipCodeLabel')}
          <input
            type="text"
            value={value.zipCode}
            onChange={(event) => onChange({ ...value, zipCode: event.target.value })}
            className="field-input px-3 py-2"
          />
        </label>
      </div>
    </div>
  )
}
