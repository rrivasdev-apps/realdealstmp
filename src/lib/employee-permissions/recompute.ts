import 'server-only'

import type { Permission } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const PERMISSION_FLAGS: Permission[] = [
  'can_manage_team',
  'can_manage_settings',
  'can_view_financials',
  'can_manage_payroll',
  'view_whiteboard',
  'view_deal_detail',
  'edit_deal_detail',
  'view_contacts',
  'edit_contacts',
]

// Recomputes one profile's permission snapshot (profile_permissions) as the
// OR-union of every role currently assigned to them, and upserts it. This is
// the "assigning a role pushes its template down" behavior Rafael described
// -- call it after profile_employee_roles changes for a profile (role
// (re)assignment), or once per affected profile when a role's own template
// is edited (the cascade). Uses the service-role client since
// profile_permissions has no insert/update policy -- it's only ever written
// this way.
export async function recomputeProfilePermissions(profileId: string) {
  const admin = createAdminClient()

  const { data: roleRows } = await admin
    .from('profile_employee_roles')
    .select(
      'employee_roles(can_manage_team, can_manage_settings, can_view_financials, can_manage_payroll, view_whiteboard, view_deal_detail, edit_deal_detail, view_contacts, edit_contacts)'
    )
    .eq('profile_id', profileId)

  const flags: Record<Permission, boolean> = {
    can_manage_team: false,
    can_manage_settings: false,
    can_view_financials: false,
    can_manage_payroll: false,
    view_whiteboard: false,
    view_deal_detail: false,
    edit_deal_detail: false,
    view_contacts: false,
    edit_contacts: false,
  }

  for (const row of roleRows ?? []) {
    const role = row.employee_roles
    if (!role) continue
    for (const flag of PERMISSION_FLAGS) {
      if (role[flag]) flags[flag] = true
    }
  }

  await admin.from('profile_permissions').upsert({ profile_id: profileId, ...flags })
}
