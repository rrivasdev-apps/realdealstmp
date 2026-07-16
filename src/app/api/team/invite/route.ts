import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/auth'

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const supabaseAdmin = createAdminClient()

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { company_id: admin.company_id, role: 'member' },
    redirectTo: `${origin}/auth/confirm?next=/set-password`,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
