import { NextResponse } from 'next/server'

import { removeCommissionPaymentsForDealEmployee, syncCommissionPaymentsForDealEmployeeRoles } from '@/lib/deals/commissions'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

async function loadDealEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  dealId: string,
  employeeId: string,
  companyId: string
) {
  const { data: dealEmployee } = await supabase
    .from('deal_employees')
    .select('id, deal_id, profile_id, deals(company_id)')
    .eq('id', employeeId)
    .eq('deal_id', dealId)
    .single()

  if (!dealEmployee || dealEmployee.deals?.company_id !== companyId) {
    return null
  }

  return dealEmployee
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id: dealId, employeeId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const dealEmployee = await loadDealEmployee(supabase, dealId, employeeId, profile.company_id)
  if (!dealEmployee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const requestedRoleIds: string[] = Array.isArray(body.employee_role_ids) ? body.employee_role_ids : []

  // The only roles selectable for this deal are the ones already configured
  // on the employee's profile -- never trust the client's list as-is.
  const { data: configuredRoles } = await supabase
    .from('profile_employee_roles')
    .select('employee_role_id')
    .eq('profile_id', dealEmployee.profile_id)
  const configuredRoleIds = new Set((configuredRoles ?? []).map((row) => row.employee_role_id))
  const employeeRoleIds = requestedRoleIds.filter((roleId) => configuredRoleIds.has(roleId))

  const { error: syncError } = await syncCommissionPaymentsForDealEmployeeRoles(supabase, {
    companyId: profile.company_id,
    dealId,
    profileId: dealEmployee.profile_id,
    employeeRoleIds,
  })
  if (syncError) {
    return NextResponse.json({ error: syncError }, { status: 400 })
  }

  const { error: deleteError } = await supabase
    .from('deal_employee_roles')
    .delete()
    .eq('deal_employee_id', dealEmployee.id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (employeeRoleIds.length > 0) {
    const { error: insertError } = await supabase
      .from('deal_employee_roles')
      .insert(employeeRoleIds.map((employee_role_id) => ({ deal_employee_id: dealEmployee.id, employee_role_id })))
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id: dealEmployee.id })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; employeeId: string }> }) {
  const { id: dealId, employeeId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const dealEmployee = await loadDealEmployee(supabase, dealId, employeeId, profile.company_id)
  if (!dealEmployee) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error: removeError } = await removeCommissionPaymentsForDealEmployee(supabase, {
    dealId,
    profileId: dealEmployee.profile_id,
  })
  if (removeError) {
    return NextResponse.json({ error: removeError }, { status: 400 })
  }

  const { error } = await supabase.from('deal_employees').delete().eq('id', dealEmployee.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
