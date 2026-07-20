import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type Profile = {
  id: string
  company_id: string | null
  name: string
  email: string
  role: 'admin' | 'member'
  employee_role: {
    can_manage_team: boolean
    can_manage_settings: boolean
    can_view_financials: boolean
  } | null
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
      'id, company_id, name, email, role, employee_role:employee_roles(can_manage_team, can_manage_settings, can_view_financials)'
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
// an admin always passes regardless of employee_role. Never use this for
// employee_roles' own capability-editing routes: a can_manage_settings
// manager granting themselves can_manage_team/can_manage_settings/
// can_view_financials via their own role would be a straight escalation to
// admin-equivalent power. Those stay on requireAdmin().
export async function requirePermission(
  permission: 'can_manage_team' | 'can_manage_settings' | 'can_view_financials'
): Promise<Profile | null> {
  const profile = await requireProfile()
  if (!profile) {
    return null
  }
  if (profile.role === 'admin' || profile.employee_role?.[permission]) {
    return profile
  }
  return null
}
