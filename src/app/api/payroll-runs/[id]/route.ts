import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Updates entries' hours_worked on a draft run -- RLS already restricts
// this to draft runs (payroll_run_entries' update policy joins to
// payroll_runs.status = 'draft'), so a finalized run's entries simply
// won't update, no extra guard needed here.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const body = await request.json()
  const entries: { id: string; hours_worked: number | null }[] = Array.isArray(body.entries) ? body.entries : []

  await Promise.all(
    entries.map((entry) =>
      supabase
        .from('payroll_run_entries')
        .update({ hours_worked: entry.hours_worked })
        .eq('id', entry.id)
        .eq('payroll_run_id', id)
    )
  )

  return NextResponse.json({ id })
}
