import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/supabase/auth'

type AddressComponent = { longText: string; shortText: string; types: string[] }

function componentFor(components: AddressComponent[], type: string): AddressComponent | undefined {
  return components.find((component) => component.types.includes(type))
}

// Server-side proxy for Google's Places API (New) place-details endpoint, decomposing
// the result into the street/city/state/zip fields AddressFields fills in on selection.
// Same "no key configured" fallback signal as /api/places/autocomplete.
export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) {
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
  const city = componentFor(components, 'locality')?.longText ?? null
  const state = componentFor(components, 'administrative_area_level_1')?.shortText ?? null
  const zipCode = componentFor(components, 'postal_code')?.longText ?? null

  return NextResponse.json({ configured: true, address: address || null, city, state, zip_code: zipCode })
}
