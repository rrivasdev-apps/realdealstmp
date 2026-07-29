import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// One "name,code" pair per line (code optional), scoped to a single country chosen
// once for the whole import -- same textarea-paste pattern as /api/countries/import.
export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const text: string = typeof body.text === 'string' ? body.text : ''
  const countryId = typeof body.country_id === 'string' ? body.country_id : ''
  if (!countryId) {
    return NextResponse.json({ error: 'Choose a country to import into.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: country } = await supabase.from('countries').select('id').eq('id', countryId).eq('company_id', profile.company_id).single()
  if (!country) {
    return NextResponse.json({ error: 'That country was not found.' }, { status: 400 })
  }

  const rows = text
    .split('\n')
    .map((line) => line.split(',').map((part) => part.trim()))
    .filter(([name]) => name)
    .map(([name, code]) => ({
      company_id: profile.company_id as string,
      country_id: countryId,
      name,
      code: code ? code.toUpperCase() : null,
    }))

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Paste at least one state name.' }, { status: 400 })
  }

  const { error, count } = await supabase.from('states').insert(rows, { count: 'exact' })

  if (error) {
    return NextResponse.json({ error: 'Some rows could not be imported (check for duplicate state names).' }, { status: 400 })
  }

  return NextResponse.json({ imported: count ?? rows.length })
}
