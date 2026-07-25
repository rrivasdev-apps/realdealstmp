import { NextResponse } from 'next/server'

import { requireUser } from '@/lib/supabase/auth'

// Server-side proxy for Google's Places API (New) autocomplete endpoint -- the API key
// never reaches the browser. If GOOGLE_MAPS_API_KEY isn't configured (e.g. Rafael hasn't
// set one up yet, or a self-hosted deployment doesn't use this service), this is the
// signal AddressFields uses to fall back to plain manual entry instead of erroring.
export async function GET(request: Request) {
  const user = await requireUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const input = new URL(request.url).searchParams.get('input')?.trim()
  if (!input) {
    return NextResponse.json({ configured: true, predictions: [] })
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    return NextResponse.json({ configured: false, predictions: [] })
  }

  const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
    body: JSON.stringify({ input }),
  })

  if (!response.ok) {
    // Swallowed for the client (falls back to plain manual entry either way), but
    // logged server-side -- a misconfigured key/API in Google Cloud Console (wrong
    // API enabled, key restrictions, billing) otherwise looks identical to "working
    // as designed" from the UI, with no way to tell the two apart.
    console.error('Places autocomplete request failed:', response.status, await response.text())
    return NextResponse.json({ configured: true, predictions: [] })
  }

  const data = await response.json()
  const predictions = (data.suggestions ?? [])
    .filter((suggestion: { placePrediction?: unknown }) => suggestion.placePrediction)
    .map((suggestion: { placePrediction: { placeId: string; text: { text: string } } }) => ({
      placeId: suggestion.placePrediction.placeId,
      text: suggestion.placePrediction.text.text,
    }))

  return NextResponse.json({ configured: true, predictions })
}
