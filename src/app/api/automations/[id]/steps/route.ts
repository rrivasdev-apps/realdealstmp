import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// Creates one empty "Drop Action Here" placeholder step (step_type null) at the
// end of the list. Its type and everything else get set by a follow-up PATCH to
// /api/automations/[id]/steps/[stepId] once the user picks an action type.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: lastStep } = await supabase
    .from('automation_template_steps')
    .select('step_number')
    .eq('template_id', id)
    .order('step_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextStepNumber = (lastStep?.step_number ?? 0) + 1

  const { data, error } = await supabase
    .from('automation_template_steps')
    .insert({ template_id: id, step_number: nextStepNumber })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not add step.' }, { status: 400 })
  }

  // A template only becomes "not functional" once it has an incomplete step --
  // adding an empty placeholder always flips it false.
  await supabase.from('automation_templates').update({ is_functional: false }).eq('id', id)

  return NextResponse.json(data)
}
