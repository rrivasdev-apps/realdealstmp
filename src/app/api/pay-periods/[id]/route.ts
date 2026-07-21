import { NextResponse } from 'next/server'

import { parsePayPeriodFields } from '@/lib/pay-periods/validate'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('pay_periods').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = parsePayPeriodFields(body)
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // first_payday is intentionally not accepted here -- set once at creation,
  // never touched again (see /api/pay-periods POST). next_payday is the
  // "current" value and is editable.
  const nextPayday = typeof body.next_payday === 'string' && body.next_payday ? body.next_payday : null

  const { error } = await supabase
    .from('pay_periods')
    .update({ ...parsed.data, next_payday: nextPayday })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id })
}
