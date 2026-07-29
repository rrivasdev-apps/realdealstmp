import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Used by the deal-form Country/State dropdown pair (State options depend on the
// selected Country, re-fetched client-side on change) and by the Settings States
// section's country filter.
export async function GET(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const countryId = new URL(request.url).searchParams.get('country_id')
  if (!countryId) {
    return NextResponse.json({ error: 'country_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('states')
    .select('id, name, code')
    .eq('company_id', profile.company_id)
    .eq('country_id', countryId)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const code = typeof body.code === 'string' && body.code.trim() ? body.code.trim().toUpperCase() : null
  const countryId = typeof body.country_id === 'string' ? body.country_id : ''
  if (!name || !countryId) {
    return NextResponse.json({ error: 'Name and country are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: country } = await supabase.from('countries').select('id').eq('id', countryId).eq('company_id', profile.company_id).single()
  if (!country) {
    return NextResponse.json({ error: 'That country was not found.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('states')
    .insert({ company_id: profile.company_id, country_id: countryId, name, code })
    .select('id, name, code')
    .single()

  if (error || !data) {
    const message = error?.code === '23505' ? 'That state is already in your list.' : (error?.message ?? 'Could not create state.')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json(data)
}
