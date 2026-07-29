import { NextResponse } from 'next/server'

import { resolveCity, resolveCountry, resolveState } from '@/lib/geography/resolve'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type AddressComponent = { longText: string; shortText: string; types: string[] }

function componentFor(components: AddressComponent[], type: string): AddressComponent | undefined {
  return components.find((component) => component.types.includes(type))
}

// Server-side proxy for Google's Places API (New) place-details endpoint, decomposing
// the result into street/city/state/country/zip, then resolving city/state/country
// against the caller's company geography (src/lib/geography/resolve.ts) -- creating
// any that don't exist yet using Google's canonical spelling, so a new city never
// blocks address entry. Same "no key configured" fallback signal as
// /api/places/autocomplete.
export async function GET(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const placeId = new URL(request.url).searchParams.get('placeId')?.trim()
  if (!placeId) {
    return NextResponse.json({ error: 'placeId is required' }, { status: 400 })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ configured: false })
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'addressComponents' },
  })

  if (!response.ok) {
    console.error('Places details request failed:', response.status, await response.text())
    return NextResponse.json({ error: 'Could not look up that address.' }, { status: 400 })
  }

  const data = await response.json()
  const components: AddressComponent[] = data.addressComponents ?? []

  const streetNumber = componentFor(components, 'street_number')?.longText ?? ''
  const route = componentFor(components, 'route')?.longText ?? ''
  const address = [streetNumber, route].filter(Boolean).join(' ')
  const cityName = componentFor(components, 'locality')?.longText ?? null
  const stateComponent = componentFor(components, 'administrative_area_level_1')
  const countryComponent = componentFor(components, 'country')
  const zipCode = componentFor(components, 'postal_code')?.longText ?? null

  const supabase = await createClient()
  let countryId: string | null = null
  let countryName: string | null = null
  let stateId: string | null = null
  let stateName: string | null = null
  let cityId: string | null = null

  if (countryComponent) {
    const country = await resolveCountry(supabase, profile.company_id, countryComponent.shortText, countryComponent.longText)
    countryId = country?.id ?? null
    countryName = country?.name ?? null
  }

  if (countryId && stateComponent) {
    const state = await resolveState(supabase, profile.company_id, countryId, {
      name: stateComponent.longText,
      code: stateComponent.shortText || null,
    })
    stateId = state?.id ?? null
    stateName = state?.name ?? null
  }

  if (stateId && cityName) {
    const city = await resolveCity(supabase, profile.company_id, stateId, cityName)
    cityId = city?.id ?? null
  }

  return NextResponse.json({
    configured: true,
    address: address || null,
    zip_code: zipCode,
    country_id: countryId,
    country_name: countryName,
    state_id: stateId,
    state_name: stateName,
    city_id: cityId,
    city_name: cityName,
  })
}
