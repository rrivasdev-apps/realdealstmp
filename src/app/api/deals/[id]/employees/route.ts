import { NextResponse } from 'next/server'

import { createCommissionPaymentsForDealEmployee } from '@/lib/deals/commissions'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('company_id').eq('id', dealId).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const employeeProfileId = typeof body.profile_id === 'string' ? body.profile_id : ''
  if (!employeeProfileId) {
    return NextResponse.json({ error: 'profile_id is required.' }, { status: 400 })
  }

  const { data: employeeProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', employeeProfileId)
    .single()
  if (!employeeProfile || employeeProfile.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Employee not found.' }, { status: 400 })
  }

  const { data: dealEmployee, error } = await supabase
    .from('deal_employees')
    .insert({ deal_id: dealId, profile_id: employeeProfileId })
    .select('id')
    .single()

  if (error || !dealEmployee) {
    return NextResponse.json({ error: error?.message ?? 'Could not add employee.' }, { status: 400 })
  }

  // Commission calc runs immediately, per Rafael -- as soon as the employee
  // is added to the deal, not deferred to a later step.
  await createCommissionPaymentsForDealEmployee(supabase, {
    companyId: profile.company_id,
    dealId,
    profileId: employeeProfileId,
  })

  return NextResponse.json({ id: dealEmployee.id })
}
