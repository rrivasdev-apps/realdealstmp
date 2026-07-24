'use client'

import { useEffect, useRef, useState } from 'react'

export type AddressValue = { address: string; city: string; state: string; zipCode: string }

type Prediction = { placeId: string; text: string }

// Street-address input with an optional Google Places autocomplete dropdown, plus
// always-editable City/State/Zip inputs beneath it. Works identically whether
// GOOGLE_MAPS_API_KEY is configured or not -- when it isn't (or a given address has no
// match), suggestions simply never appear and every field stays plain manual entry, so
// there's no separate "unavailable" state to design for.
export function AddressFields({ value, onChange }: { value: AddressValue; onChange: (value: AddressValue) => void }) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [showPredictions, setShowPredictions] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
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
      city: result.city ?? '',
      state: result.state ?? '',
      zipCode: result.zip_code ?? '',
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <label className="field-label">
          Address
          <input
            type="text"
            required
            value={value.address}
            onChange={(event) => handleAddressChange(event.target.value)}
            onFocus={() => setShowPredictions(true)}
            onBlur={() => setTimeout(() => setShowPredictions(false), 150)}
            autoComplete="off"
            className="rounded border border-input-border bg-input-background px-3 py-2"
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
          City
          <input
            type="text"
            value={value.city}
            onChange={(event) => onChange({ ...value, city: event.target.value })}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="field-label">
          State
          <input
            type="text"
            value={value.state}
            onChange={(event) => onChange({ ...value, state: event.target.value })}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="field-label">
          Zip code
          <input
            type="text"
            value={value.zipCode}
            onChange={(event) => onChange({ ...value, zipCode: event.target.value })}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      </div>
    </div>
  )
}
