import { NextResponse } from 'next/server'

import { CAPABILITY_GROUPS, type Capabilities } from '@/lib/employee-permissions/labels'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

const CAPABILITY_KEYS = CAPABILITY_GROUPS.flatMap((group) => group.keys)

// Direct per-employee override (write path 3, per Rafael's template/cascade
// design): edits profile_permissions for ONE profile directly, independent
// of whatever role(s) they hold. Unlike /api/team/[id] (which recomputes
// permissions FROM assigned roles) or /api/employee-roles/[id] (which
// cascades a role's template to its members), this is a one-off override
// that survives until the employee's roles change again or an admin
// re-cascades a role template onto them.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requirePermission('can_manage_team')
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: target } = await supabase.from('profiles').select('company_id').eq('id', id).single()
  if (!target || target.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  if (!body.capabilities || typeof body.capabilities !== 'object') {
    return NextResponse.json({ error: 'capabilities is required.' }, { status: 400 })
  }

  const capabilitiesUpdate = {} as Capabilities
  for (const key of CAPABILITY_KEYS) {
    capabilitiesUpdate[key] = Boolean(body.capabilities[key])
  }

  // profile_permissions has no insert/update RLS policy -- only ever written
  // via the service-role client, same posture as profiles.pay_type/employee
  // role assignment.
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('profile_permissions').upsert({ profile_id: id, ...capabilitiesUpdate })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id })
}
