import { NextResponse } from 'next/server'

import { CAPABILITY_GROUPS, type Capabilities } from '@/lib/employee-permissions/labels'
import { recomputeProfilePermissions } from '@/lib/employee-permissions/recompute'
import { requireAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

const CAPABILITY_KEYS = CAPABILITY_GROUPS.flatMap((group) => group.keys)

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

  // Two independent, optional edits on this page -- the capabilities form
  // and the commission-types form each submit only their own field, so
  // either can be updated without touching the other.
  if (body.capabilities && typeof body.capabilities === 'object') {
    const { data: memberRows } = await supabase
      .from('profile_employee_roles')
      .select('profile_id')
      .eq('employee_role_id', id)
    const memberIds = (memberRows ?? []).map((row) => row.profile_id)

    // A role's capabilities are a template: changing them cascades down to
    // every employee currently assigned this role, overwriting their
    // individual permission snapshot (see profile_permissions/
    // recomputeProfilePermissions). Require the client to explicitly
    // confirm that before it happens, rather than silently overwriting
    // employees' individually-tuned permissions.
    if (memberIds.length > 0 && body.confirmed !== true) {
      return NextResponse.json({ needsConfirmation: true, affectedCount: memberIds.length })
    }

    const capabilitiesUpdate = {} as Capabilities
    for (const key of CAPABILITY_KEYS) {
      capabilitiesUpdate[key] = Boolean(body.capabilities[key])
    }
    const { error: capabilitiesError } = await supabase.from('employee_roles').update(capabilitiesUpdate).eq('id', id)
    if (capabilitiesError) {
      return NextResponse.json({ error: capabilitiesError.message }, { status: 400 })
    }

    await Promise.all(memberIds.map((profileId) => recomputeProfilePermissions(profileId)))
  }

  if (Array.isArray(body.commission_type_ids)) {
    const commissionTypeIds: string[] = body.commission_type_ids

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
  }

  if (Array.isArray(body.contact_type_ids)) {
    const contactTypeIds: string[] = body.contact_type_ids

    // contact_types is a global lookup, not company-scoped -- just confirm
    // the submitted ids are real rows, no company filter needed.
    const { data: validTypes } = await supabase
      .from('contact_types')
      .select('id')
      .in('id', contactTypeIds.length ? contactTypeIds : ['00000000-0000-0000-0000-000000000000'])

    const validIds = (validTypes ?? []).map((row) => row.id)

    const { error: deleteError } = await supabase
      .from('employee_role_contact_types')
      .delete()
      .eq('employee_role_id', id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    if (validIds.length) {
      const { error: insertError } = await supabase
        .from('employee_role_contact_types')
        .insert(validIds.map((contact_type_id) => ({ employee_role_id: id, contact_type_id })))
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }
  }

  return NextResponse.json({ id })
}
