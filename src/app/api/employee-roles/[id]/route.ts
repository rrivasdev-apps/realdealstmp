import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: employeeRole } = await supabase.from('employee_roles').select('company_id').eq('id', id).single()
  if (!employeeRole || employeeRole.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const commissionTypeIds: string[] = Array.isArray(body.commission_type_ids) ? body.commission_type_ids : []

  const { data: validTypes } = await supabase
    .from('commission_types')
    .select('id')
    .eq('company_id', admin.company_id)
    .in('id', commissionTypeIds.length ? commissionTypeIds : ['00000000-0000-0000-0000-000000000000'])

  const validIds = (validTypes ?? []).map((row) => row.id)

  // RLS already gates these writes to admins of this employee_role's
  // company (see employee_role_commission_types' policies) -- the regular
  // client is enough here, no need for the service-role client.
  const { error: deleteError } = await supabase
    .from('employee_role_commission_types')
    .delete()
    .eq('employee_role_id', id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 })
  }

  if (validIds.length) {
    const { error: insertError } = await supabase
      .from('employee_role_commission_types')
      .insert(validIds.map((commission_type_id) => ({ employee_role_id: id, commission_type_id })))
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ id })
}
