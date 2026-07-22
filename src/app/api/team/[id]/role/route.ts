import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Promoting/demoting a teammate between 'admin' and 'member' is an
// escalation-class action -- stays on requireAdmin() rather than
// requireTeamAccess(), same posture as employee_roles' own routes (see
// src/lib/supabase/auth.ts).
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requireAdmin()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  if (body.role !== 'admin' && body.role !== 'member') {
    return NextResponse.json({ error: "role must be 'admin' or 'member'." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: target } = await supabase.from('profiles').select('company_id, role').eq('id', id).single()
  if (!target || target.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (target.role === 'admin' && body.role === 'member') {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', admin.company_id)
      .eq('role', 'admin')

    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Cannot remove the only remaining admin.' }, { status: 400 })
    }
  }

  // profiles' UPDATE policy only allows self-updates, and the row-level
  // trigger protecting role/company_id only lifts for service-role callers
  // -- see 20260728000002_admin_role_change.sql.
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('profiles').update({ role: body.role }).eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id, role: body.role })
}
