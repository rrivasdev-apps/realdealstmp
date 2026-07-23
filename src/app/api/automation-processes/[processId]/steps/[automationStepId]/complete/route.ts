import { NextResponse } from 'next/server'

import { completeStep } from '@/lib/automations/runtime'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

// "This Has Been Completed" -- applies the step's action (writing deal/custom
// fields for Fill Fields, recording the chosen option for Conditional
// Statement/Option List, or just advancing for the simple types) and moves
// the process to whatever comes next.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ processId: string; automationStepId: string }> }
) {
  const { processId, automationStepId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: process } = await supabase.from('automation_processes').select('id, deal_id').eq('id', processId).single()
  if (!process) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const { data: deal } = await supabase.from('deals').select('company_id').eq('id', process.deal_id).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: step } = await supabase
    .from('automation_steps')
    .select('id')
    .eq('id', automationStepId)
    .eq('process_id', processId)
    .single()
  if (!step) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const result = await completeStep(supabase, {
    automationStepId,
    actingProfileId: profile.id,
    companyId: profile.company_id,
    fieldValues: typeof body.field_values === 'object' && body.field_values !== null ? body.field_values : undefined,
    selectedOptionKey: typeof body.selected_option_key === 'string' ? body.selected_option_key : undefined,
    selectedOptionKeys: Array.isArray(body.selected_option_keys) ? body.selected_option_keys : undefined,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ id: automationStepId })
}
