import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

export type AssigneeInput = {
  assigned_role_id?: string | null
  assigned_profile_id?: string | null
}

export type AssigneeResult =
  | { ok: true; assigned_role_id: string | null; assigned_profile_id: string | null }
  | { ok: false; error: string }

// Exactly one of role/specific-user must be set, and whichever is set must belong
// to this company -- defense in depth behind the RLS policy's same check, and
// where the actually-informative 400 error message comes from.
export async function validateAssignee(
  supabase: SupabaseClient<Database>,
  companyId: string,
  input: AssigneeInput
): Promise<AssigneeResult> {
  const roleId = input.assigned_role_id || null
  const profileId = input.assigned_profile_id || null

  if ((roleId !== null) === (profileId !== null)) {
    return { ok: false, error: 'Assign this step to exactly one of a role or a specific user.' }
  }

  if (roleId) {
    const { data } = await supabase.from('employee_roles').select('id').eq('id', roleId).eq('company_id', companyId).single()
    if (!data) return { ok: false, error: 'That role was not found.' }
  } else if (profileId) {
    const { data } = await supabase.from('profiles').select('id').eq('id', profileId).eq('company_id', companyId).single()
    if (!data) return { ok: false, error: 'That user was not found.' }
  }

  return { ok: true, assigned_role_id: roleId, assigned_profile_id: profileId }
}
