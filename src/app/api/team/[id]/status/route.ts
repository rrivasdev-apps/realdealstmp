import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireTeamAccess } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Employees are hidden, never destroyed -- "deleting" one sets
// profiles.deleted_at and revokes their access; restoring clears both. Every
// payment, commission and deal assignment they're attached to is untouched
// either way, which is the whole point of doing it this way (see
// 20260810000005_profile_soft_delete.sql).
const BAN_DURATION = '876000h' // ~100 years; GoTrue has no "forever", and 'none' lifts it.

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireTeamAccess()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: target } = await supabase.from('profiles').select('company_id, role, deleted_at').eq('id', id).single()
  if (!target || target.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const deleted = Boolean(body.deleted)

  if (deleted) {
    // Deleting yourself would lock you out of the account you're using to
    // manage the team, with no way back in to undo it.
    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own employee record.' }, { status: 400 })
    }

    // Nor may the last admin go: employee_roles' capability flags are
    // editable by admins only (requireAdmin, deliberately -- see auth.ts), so
    // a company with no active admin could never edit them again.
    if (target.role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', admin.company_id)
        .eq('role', 'admin')
        .is('deleted_at', null)

      if ((count ?? 0) <= 1) {
        return NextResponse.json({ error: "You cannot delete the company's last admin." }, { status: 400 })
      }
    }
  }

  // profiles' UPDATE policy only allows self-updates, and the
  // protect_profile_role_and_company trigger deliberately pins deleted_at on
  // that path -- so this has to go through the admin client, same as every
  // other team-management write.
  const adminClient = createAdminClient()
  const { error } = await adminClient
    .from('profiles')
    .update({ deleted_at: deleted ? new Date().toISOString() : null })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Banning is what actually stops them signing in or refreshing a token;
  // requireProfile() and RLS cover the window where they still hold a valid
  // access token issued moments ago.
  const { error: banError } = await adminClient.auth.admin.updateUserById(id, {
    ban_duration: deleted ? BAN_DURATION : 'none',
  })

  if (banError) {
    // Roll the flag back rather than leave a "deleted" employee who can still
    // log in (or a restored one who can't).
    await adminClient
      .from('profiles')
      .update({ deleted_at: target.deleted_at })
      .eq('id', id)
    return NextResponse.json({ error: banError.message }, { status: 400 })
  }

  return NextResponse.json({ id, deleted })
}
