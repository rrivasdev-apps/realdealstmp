import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type Permission =
  | 'can_manage_team'
  | 'can_manage_settings'
  | 'can_view_financials'
  | 'can_manage_payroll'
  | 'view_whiteboard'
  | 'view_deal_detail'
  | 'edit_deal_detail'
  | 'view_contacts'
  | 'edit_contacts'

export type Profile = {
  id: string
  company_id: string | null
  name: string
  email: string
  role: 'admin' | 'member'
  // The employee's own permission snapshot (profile_permissions) -- resolved
  // ahead of time from whichever role(s) they hold, see
  // src/lib/employee-permissions/recompute.ts. Not a live join to
  // employee_roles: an employee can have this overridden independent of
  // their role, per Rafael's template/cascade design.
  permissions: Record<Permission, boolean> | null
}

// Call this at the top of every mutating Route Handler / Server Action.
// Never infer permissions from what the UI shows or hides — always re-check here.
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

// Like requireUser(), but also loads the caller's company_id/role — most
// protected routes need company_id to scope their queries/writes.
export async function requireProfile(): Promise<Profile | null> {
  const user = await requireUser()
  if (!user) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, company_id, name, email, role, permissions:profile_permissions(can_manage_team, can_manage_settings, can_view_financials, can_manage_payroll, view_whiteboard, view_deal_detail, edit_deal_detail, view_contacts, edit_contacts)'
    )
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return null
  }

  return data as unknown as Profile
}

// For admin-only routes -- reserved for the handful of actions that must
// stay admin-exclusive even for a manager with every capability flag set
// (editing employee_roles' own capabilities -- see requirePermission below
// for why that can't be delegated).
export async function requireAdmin(): Promise<Profile | null> {
  const profile = await requireProfile()
  if (!profile || profile.role !== 'admin') {
    return null
  }

  return profile
}

// For routes/pages gated by a specific capability instead of full admin --
// an admin always passes regardless of their permission snapshot. Never use
// this for employee_roles' own capability-editing routes: a
// can_manage_settings manager granting themselves can_manage_team/
// can_manage_settings/can_view_financials via their own role's template
// would be a straight escalation to admin-equivalent power. Those stay on
// requireAdmin().
export async function requirePermission(permission: Permission): Promise<Profile | null> {
  const profile = await requireProfile()
  if (!profile) {
    return null
  }
  if (profile.role === 'admin' || profile.permissions?.[permission]) {
    return profile
  }
  return null
}

// Requires ALL listed permissions (admin always bypasses) -- prefer a named
// wrapper like requireTeamAccess below at call sites, so the reason for
// requiring more than one flag is documented once, not re-explained at
// every call site.
export async function requirePermissions(permissions: Permission[]): Promise<Profile | null> {
  const profile = await requireProfile()
  if (!profile) {
    return null
  }
  if (profile.role === 'admin' || permissions.every((permission) => profile.permissions?.[permission])) {
    return profile
  }
  return null
}

// Team management now lives inside the Settings nav (Settings > Employee
// Center > Team) instead of being its own top-level item, per Rafael --
// specifically so reaching it requires the same access as Settings itself.
// Requires both can_manage_team (the underlying action) and
// can_manage_settings (matches where it now lives in the nav).
export async function requireTeamAccess(): Promise<Profile | null> {
  return requirePermissions(['can_manage_team', 'can_manage_settings'])
}
