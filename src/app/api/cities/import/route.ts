import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// One city name per line, scoped to a single state chosen once for the whole
// import -- same textarea-paste pattern as /api/countries/import and /api/states/import.
export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const text: string = typeof body.text === 'string' ? body.text : ''
  const stateId = typeof body.state_id === 'string' ? body.state_id : ''
  if (!stateId) {
    return NextResponse.json({ error: 'Choose a state to import into.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: state } = await supabase.from('states').select('id').eq('id', stateId).eq('company_id', profile.company_id).single()
  if (!state) {
    return NextResponse.json({ error: 'That state was not found.' }, { status: 400 })
  }

  const rows = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ company_id: profile.company_id as string, state_id: stateId, name }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Paste at least one city name.' }, { status: 400 })
  }

  const { error, count } = await supabase.from('cities').insert(rows, { count: 'exact' })

  if (error) {
    return NextResponse.json({ error: 'Some rows could not be imported (check for duplicate city names).' }, { status: 400 })
  }

  return NextResponse.json({ imported: count ?? rows.length })
}
