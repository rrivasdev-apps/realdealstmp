import { NextResponse } from 'next/server'

import { payPeriodRunRange } from '@/lib/pay-periods/schedule'
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
  const payPeriodId = typeof body.pay_period_id === 'string' && body.pay_period_id ? body.pay_period_id : null

  let payPeriodStart: string
  let payPeriodEnd: string
  // Only the tagged employees get entries on a pay-period run; an ad-hoc run
  // keeps paying everyone with a rate set, which is all it can mean.
  let payableProfileIds: string[] | null = null

  if (payPeriodId) {
    const { data: payPeriod } = await supabase
      .from('pay_periods')
      .select('id, company_id, salary_pay_frequency, commission_pay_frequency, first_payday, next_payday')
      .eq('id', payPeriodId)
      .single()

    if (!payPeriod || payPeriod.company_id !== admin.company_id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Dates come from the schedule, never from the request -- same rule as
    // deals' renegotiated "current" values (see CLAUDE.md): the client can
    // choose *which* period to run, not what window that period covers.
    const range = payPeriodRunRange(payPeriod)
    if (!range) {
      return NextResponse.json({ error: 'This pay period has no calendar pay schedule to run.' }, { status: 400 })
    }

    payPeriodStart = range.start
    payPeriodEnd = range.end

    const { data: tagged } = await supabase
      .from('profile_pay_periods')
      .select('profile_id')
      .eq('pay_period_id', payPeriodId)

    const taggedIds = (tagged ?? []).map((row) => row.profile_id)
    if (!taggedIds.length) {
      return NextResponse.json({ error: 'No employees are assigned to this pay period.' }, { status: 400 })
    }

    payableProfileIds = taggedIds
  } else {
    payPeriodStart = typeof body.pay_period_start === 'string' ? body.pay_period_start : ''
    payPeriodEnd = typeof body.pay_period_end === 'string' ? body.pay_period_end : ''

    if (!payPeriodStart || !payPeriodEnd) {
      return NextResponse.json({ error: 'Pay period start and end are required.' }, { status: 400 })
    }
  }

  let payableQuery = supabase
    .from('profiles')
    .select('id')
    .eq('company_id', admin.company_id)
    .is('deleted_at', null)
    .not('pay_type', 'is', null)
    .not('pay_rate', 'is', null)

  if (payableProfileIds) {
    payableQuery = payableQuery.in('id', payableProfileIds)
  }

  const { data: payableEmployees } = await payableQuery

  // Checked before the run is inserted, so a schedule whose members all lack a
  // pay rate doesn't leave behind an empty draft that can never be finalized
  // (finalizeRun bails on a run with no entries, leaving it stuck in 'draft').
  if (payPeriodId && !payableEmployees?.length) {
    return NextResponse.json(
      { error: 'No employee assigned to this pay period has a pay type and rate set.' },
      { status: 400 }
    )
  }

  const { data: run, error: runError } = await supabase
    .from('payroll_runs')
    .insert({
      company_id: admin.company_id,
      pay_period_id: payPeriodId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
    })
    .select('id')
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: runError?.message ?? 'Could not create payroll run.' }, { status: 400 })
  }

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
