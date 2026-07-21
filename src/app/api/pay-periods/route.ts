import { NextResponse } from 'next/server'

import { parsePayPeriodFields } from '@/lib/pay-periods/validate'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = parsePayPeriodFields(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // First payday is set once at creation and never touched again -- next
  // payday is the "current" value, seeded from it here, then editable going
  // forward (same original-vs-current shape as deals.closing_date /
  // original_closing_date). See docs/reference/payroll-periods.md for why
  // this form only asks for one date field.
  const firstPayday = typeof body.first_payday === 'string' && body.first_payday ? body.first_payday : null
  if (!firstPayday) {
    return NextResponse.json({ error: 'First payday is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pay_periods')
    .insert({
      company_id: profile.company_id,
      ...parsed.data,
      first_payday: firstPayday,
      next_payday: firstPayday,
    })
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create pay period.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
