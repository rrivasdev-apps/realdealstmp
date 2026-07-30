import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Prefix search against the company's own ad-hoc zip code list -- see
// docs/reference/contact-hub.md's "Zip Codes Interested In"/"Zip Codes
// Serving". No state scoping like cities: a company builds this list up one
// zip at a time as contacts are entered, there's no pre-seeded set.
export async function GET(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const query = url.searchParams.get('q')?.trim() ?? ''

  const supabase = await createClient()
  let builder = supabase
    .from('zip_codes')
    .select('id, code')
    .eq('company_id', profile.company_id)
    .order('code')
    .limit(20)

  if (query) {
    builder = builder.ilike('code', `${query}%`)
  }

  const { data, error } = await builder
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json((data ?? []).map((row) => ({ id: row.id, name: row.code })))
}

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) {
    return NextResponse.json({ error: 'A zip code is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('zip_codes')
    .insert({ company_id: profile.company_id, code })
    .select('id, code')
    .single()

  if (error || !data) {
    const message = error?.code === '23505' ? 'That zip code is already in your list.' : (error?.message ?? 'Could not create zip code.')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ id: data.id, name: data.code })
}
