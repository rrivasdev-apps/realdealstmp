import { NextResponse } from 'next/server'

import { finalizeRun } from '@/lib/payroll/finalize-run'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await requirePermission('can_manage_team')
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: run } = await supabase.from('payroll_runs').select('company_id').eq('id', id).single()
  if (!run || run.company_id !== admin.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await finalizeRun(supabase, id)

  return NextResponse.json({ id })
}
