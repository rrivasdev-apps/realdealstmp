import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const admin = await requirePermission('can_manage_payroll')
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const profileId = typeof body.profile_id === 'string' ? body.profile_id : ''
  const amount = typeof body.amount === 'number' ? body.amount : Number(body.amount)
  const payPeriodStart = typeof body.pay_period_start === 'string' ? body.pay_period_start : ''
  const payPeriodEnd = typeof body.pay_period_end === 'string' ? body.pay_period_end : ''

  if (!profileId) {
    return NextResponse.json({ error: 'Employee is required.' }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
  }
  if (!payPeriodStart || !payPeriodEnd) {
    return NextResponse.json({ error: 'Pay period start and end are required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: employee } = await supabase.from('profiles').select('company_id').eq('id', profileId).single()
  if (!employee || employee.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Employee not found.' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('payments')
    .insert({
      company_id: admin.company_id,
      type: 'payroll',
      profile_id: profileId,
      amount,
      status: 'paid',
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not record payroll payment.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
