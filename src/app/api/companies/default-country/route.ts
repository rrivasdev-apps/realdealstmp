import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Unlike single-row lookup inserts (any member can add), changing the company's
// default country is a Settings-level decision -- can_manage_settings-gated like
// the rest of the Settings page. `companies` has no update RLS policy at all (see
// 20260715000001_companies_and_profiles.sql -- deliberately, companies aren't
// client-writable), so this write goes through the admin client once the app-layer
// permission check above has passed -- same documented exception as
// src/lib/supabase/admin.ts describes.
export async function PATCH(request: Request) {
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const countryId = typeof body.country_id === 'string' ? body.country_id : ''
  if (!countryId) {
    return NextResponse.json({ error: 'Choose a country.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: country } = await supabase.from('countries').select('id').eq('id', countryId).eq('company_id', profile.company_id).single()
  if (!country) {
    return NextResponse.json({ error: 'That country was not found.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('companies').update({ default_country_id: countryId }).eq('id', profile.company_id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
