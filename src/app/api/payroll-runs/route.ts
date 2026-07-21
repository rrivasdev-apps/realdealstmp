import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const admin = await requirePermission('can_manage_payroll')
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_tier')
    .eq('id', admin.company_id)
    .single()

  if (company?.subscription_tier !== 'employee_center') {
    return NextResponse.json({ error: 'Full payroll runs require the Employee Center plan.' }, { status: 403 })
  }

  const body = await request.json()
  const payPeriodStart = typeof body.pay_period_start === 'string' ? body.pay_period_start : ''
  const payPeriodEnd = typeof body.pay_period_end === 'string' ? body.pay_period_end : ''

  if (!payPeriodStart || !payPeriodEnd) {
    return NextResponse.json({ error: 'Pay period start and end are required.' }, { status: 400 })
  }

  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .insert({ company_id: admin.company_id, pay_period_start: payPeriodStart, pay_period_end: payPeriodEnd })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? 'Could not create payroll run.' }, { status: 400 })
  }

  const { data: payableEmployees } = await supabase
    .from('profiles')
    .select('id')
    .eq('company_id', admin.company_id)
    .not('pay_type', 'is', null)
    .not('pay_rate', 'is', null)

  if (payableEmployees?.length) {
    const { error: entriesError } = await supabase
      .from('payroll_run_entries')
      .insert(payableEmployees.map((employee) => ({ payroll_run_id: run.id, profile_id: employee.id })))
    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: run.id })
}
