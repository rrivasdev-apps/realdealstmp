import { NextResponse } from 'next/server'

import { isLocale, LOCALE_CHECK_COOKIE, LOCALE_CHECK_MAX_AGE, LOCALE_COOKIE } from '@/i18n/config'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/supabase/auth'

// The company's UI language. Settings-level decision, so can_manage_settings-gated
// like the rest of the Settings page. `companies` has no update RLS policy at all
// (see 20260715000001_companies_and_profiles.sql -- deliberately, companies aren't
// client-writable), so this write goes through the admin client once the app-layer
// permission check above has passed -- same documented exception as
// src/lib/supabase/admin.ts describes.
export async function PATCH(request: Request) {
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const locale = typeof body.locale === 'string' ? body.locale : ''
  if (!isLocale(locale)) {
    return NextResponse.json({ error: 'Choose a supported language.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('companies').update({ locale }).eq('id', profile.company_id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Write the caller's locale cookie here rather than waiting for src/proxy.ts
  // to notice: the proxy only re-derives it once LOCALE_CHECK_COOKIE expires,
  // which is the right cadence for a teammate's open session but would mean the
  // person who just hit Save watches the old language for up to five minutes.
  // The check cookie is keyed by user id, matching what the proxy writes.
  const response = NextResponse.json({ ok: true })
  response.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  response.cookies.set(LOCALE_CHECK_COOKIE, profile.id, { path: '/', maxAge: LOCALE_CHECK_MAX_AGE })
  return response
}
