import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Same shape as /api/markets: any company member can add one (not admin-gated at
// this layer -- the Settings page itself is admin-only via can_manage_settings).
export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const isoCode = typeof body.iso_code === 'string' ? body.iso_code.trim().toUpperCase() : ''
  if (!name || !isoCode) {
    return NextResponse.json({ error: 'Name and country code are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('countries')
    .insert({ company_id: profile.company_id, name, iso_code: isoCode })
    .select('id, name, iso_code')
    .single()

  if (error || !data) {
    const message = error?.code === '23505' ? 'That country code is already in your list.' : (error?.message ?? 'Could not create country.')
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json(data)
}
