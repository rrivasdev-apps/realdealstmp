import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Prefix search, not a full list -- a US company can have several thousand seeded
// cities, so this backs both the deal-form city combobox and the Settings Cities
// section's search box (see cities_state_name_prefix_idx in the geography migration).
export async function GET(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const stateId = url.searchParams.get('state_id')
  const query = url.searchParams.get('q')?.trim() ?? ''
  if (!stateId) {
    return NextResponse.json({ error: 'state_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  let builder = supabase
    .from('cities')
    .select('id, name')
    .eq('company_id', profile.company_id)
    .eq('state_id', stateId)
    .order('name')
    .limit(20)

  if (query) {
    builder = builder.ilike('name', `${query}%`)
  }

  const { data, error } = await builder
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data ?? [])
}

// Used both by the Settings "add a city" form and by the deal-form combobox's
// "+ Add {name}" affordance when a typed city isn't found yet.
export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const stateId = typeof body.state_id === 'string' ? body.state_id : ''
  if (!name || !stateId) {
    return NextResponse.json({ error: 'Name and state are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: state } = await supabase.from('states').select('id').eq('id', stateId).eq('company_id', profile.company_id).single()
  if (!state) {
    return NextResponse.json({ error: 'That state was not found.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('cities')
    .insert({ company_id: profile.company_id, state_id: stateId, name })
    .select('id, name')
    .single()

  if (error || !data) {
    const message = error?.code === '23505' ? 'That city is already in your list.' : (error?.message ?? 'Could not create city.')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json(data)
}
