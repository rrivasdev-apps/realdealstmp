import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_MARKETS = ['Default Market']
const DEFAULT_DEAL_TYPES = ['Wholesale', 'Flip', 'Wholetail']
const DEFAULT_LEAD_SOURCES = [
  'Referral',
  'Direct Mail',
  'Cold Call',
  'PPC',
  'Driving for Dollars',
  'Website/SEO',
  'Other',
]

// Public route — the one intentional exception to "every mutating route
// calls requireUser()": this route creates the first user. Signing up
// always creates a new company with the caller as its admin; teammates can
// only join afterward via an admin's invite (see /api/team/invite).
export async function POST(request: Request) {
  const body = await request.json()
  const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!companyName || !name || !email || !password) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: company, error: companyError } = await admin
    .from('companies')
    .insert({ name: companyName })
    .select('id')
    .single()

  if (companyError || !company) {
    return NextResponse.json({ error: 'Could not create company.' }, { status: 400 })
  }

  const seedResults = await Promise.all([
    admin.from('markets').insert(DEFAULT_MARKETS.map((name) => ({ company_id: company.id, name }))),
    admin.from('deal_types').insert(DEFAULT_DEAL_TYPES.map((name) => ({ company_id: company.id, name }))),
    admin
      .from('lead_sources')
      .insert(DEFAULT_LEAD_SOURCES.map((name) => ({ company_id: company.id, name }))),
  ])
  const seedError = seedResults.find((result) => result.error)?.error

  if (seedError) {
    await admin.from('companies').delete().eq('id', company.id)
    return NextResponse.json({ error: 'Could not set up company defaults.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const supabase = await createClient()
  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { company_id: company.id, role: 'admin', name },
      emailRedirectTo: `${origin}/auth/confirm?next=/dashboard`,
    },
  })

  if (signUpError) {
    await admin.from('companies').delete().eq('id', company.id)
    return NextResponse.json({ error: signUpError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
