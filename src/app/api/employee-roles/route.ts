import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('employee_roles')
    .insert({ company_id: admin.company_id, name })
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create employee role.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
