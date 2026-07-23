import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Takes the full desired order as a list of step ids. Two passes (offset, then
// final) since each supabase-js call is its own transaction and writing final
// step_numbers in one pass could transiently collide with another row that
// hasn't moved yet.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: template } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!template || template.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const stepIds: string[] = Array.isArray(body.step_ids) ? body.step_ids : []

  const { data: existingSteps } = await supabase.from('automation_template_steps').select('id').eq('template_id', id)
  const existingIds = new Set((existingSteps ?? []).map((row) => row.id))

  if (stepIds.length !== existingIds.size || !stepIds.every((stepId) => existingIds.has(stepId))) {
    return NextResponse.json({ error: 'The submitted order must include every step exactly once.' }, { status: 400 })
  }

  await Promise.all(
    stepIds.map((stepId, index) =>
      supabase.from('automation_template_steps').update({ step_number: index + 100000 }).eq('id', stepId)
    )
  )
  await Promise.all(
    stepIds.map((stepId, index) => supabase.from('automation_template_steps').update({ step_number: index + 1 }).eq('id', stepId))
  )

  return NextResponse.json({ id })
}
