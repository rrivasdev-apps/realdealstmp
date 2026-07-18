import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: target } = await supabase.from('profiles').select('company_id').eq('id', id).single()
  if (!target || target.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const employeeRoleId: string | null = body.employee_role_id || null
  const commissionTypeIds: string[] = Array.isArray(body.commission_type_ids) ? body.commission_type_ids : []

  // profiles' UPDATE policy only allows self-updates -- an admin setting
  // another member's employee_role_id has to go through the admin client.
  const adminClient = createAdminClient()
  const { error: profileError } = await adminClient
    .from('profiles')
    .update({ employee_role_id: employeeRoleId })
    .eq('id', id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 })
  }

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

  return NextResponse.json({ id })
}
