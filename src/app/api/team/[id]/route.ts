import { NextResponse } from 'next/server'

import { recomputeProfilePermissions } from '@/lib/employee-permissions/recompute'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireTeamAccess } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireTeamAccess()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: target } = await supabase.from('profiles').select('company_id').eq('id', id).single()
  if (!target || target.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const employeeRoleIds: string[] = Array.isArray(body.employee_role_ids) ? body.employee_role_ids : []
  const commissionTypeIds: string[] = Array.isArray(body.commission_type_ids) ? body.commission_type_ids : []
  const payPeriodIds: string[] = Array.isArray(body.pay_period_ids) ? body.pay_period_ids : []
  const payType = body.pay_type === 'hourly' || body.pay_type === 'salary' ? body.pay_type : null
  const payRate = typeof body.pay_rate === 'number' && Number.isFinite(body.pay_rate) ? body.pay_rate : null
  const employeeType =
    body.employee_type === 'full_time' || body.employee_type === 'part_time' || body.employee_type === 'contractor'
      ? body.employee_type
      : null
  const hireDate = typeof body.hire_date === 'string' && body.hire_date ? body.hire_date : null
  const birthDate = typeof body.birth_date === 'string' && body.birth_date ? body.birth_date : null
  const address = typeof body.address === 'string' && body.address ? body.address : null
  const paidVia = typeof body.paid_via === 'string' && body.paid_via ? body.paid_via : null
  const automaticEmails = Boolean(body.automatic_emails)

  // profiles' UPDATE policy only allows self-updates -- an admin setting
  // another member's pay rate/profile fields has to go through the admin client.
  const adminClient = createAdminClient()
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({
      pay_type: payType,
      pay_rate: payRate,
      employee_type: employeeType,
      hire_date: hireDate,
      birth_date: birthDate,
      address,
      paid_via: paidVia,
      automatic_emails: automaticEmails,
    })
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

  // Re-scope the submitted ids to employee roles this admin's company
  // actually owns, then replace the full assignment set -- same
  // delete-then-insert pattern as commission types below.
  const { data: validRoles } = await supabase
    .from('employee_roles')
    .select('id')
    .eq('company_id', admin.company_id)
    .in('id', employeeRoleIds.length ? employeeRoleIds : ['00000000-0000-0000-0000-000000000000'])

  const validRoleIds = (validRoles ?? []).map((row) => row.id)

  const { error: deleteRolesError } = await supabase.from('profile_employee_roles').delete().eq('profile_id', id)
  if (deleteRolesError) {
    return NextResponse.json({ error: deleteRolesError.message }, { status: 400 })
  }

  if (validRoleIds.length) {
    const { error: insertRolesError } = await supabase
      .from('profile_employee_roles')
      .insert(validRoleIds.map((employee_role_id) => ({ profile_id: id, employee_role_id })))
    if (insertRolesError) {
      return NextResponse.json({ error: insertRolesError.message }, { status: 400 })
    }
  }

  // Push the (possibly new) set of assigned roles' capability flags down
  // onto this employee's own permission snapshot.
  await recomputeProfilePermissions(id)

  // Re-scope the submitted ids to commission types this admin's company
  // actually owns, then replace the full assignment set.
  const { data: validTypes } = await supabase
    .from('commission_types')
    .select('id')
    .eq('company_id', admin.company_id)
    .in('id', commissionTypeIds.length ? commissionTypeIds : ['00000000-0000-0000-0000-000000000000'])

  const validIds = (validTypes ?? []).map((row) => row.id)

  const { error: deleteError } = await supabase.from('profile_commission_types').delete().eq('profile_id', id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (validIds.length) {
    const { error: insertError } = await supabase
      .from('profile_commission_types')
      .insert(validIds.map((commission_type_id) => ({ profile_id: id, commission_type_id })))
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  // Re-scope the submitted ids to pay periods this admin's company actually
  // owns, then replace the full assignment set -- same pattern as above.
  const { data: validPayPeriods } = await supabase
    .from('pay_periods')
    .select('id')
    .eq('company_id', admin.company_id)
    .in('id', payPeriodIds.length ? payPeriodIds : ['00000000-0000-0000-0000-000000000000'])

  const validPayPeriodIds = (validPayPeriods ?? []).map((row) => row.id)

  const { error: deletePayPeriodsError } = await supabase.from('profile_pay_periods').delete().eq('profile_id', id)
  if (deletePayPeriodsError) {
    return NextResponse.json({ error: deletePayPeriodsError.message }, { status: 400 })
  }

  if (validPayPeriodIds.length) {
    const { error: insertPayPeriodsError } = await supabase
      .from('profile_pay_periods')
      .insert(validPayPeriodIds.map((pay_period_id) => ({ profile_id: id, pay_period_id })))
    if (insertPayPeriodsError) {
      return NextResponse.json({ error: insertPayPeriodsError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id })
}
