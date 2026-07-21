import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pay_periods')
    .insert({ company_id: profile.company_id, name })
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create pay period.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
