import { NextResponse } from 'next/server'

import { recomputeTemplateFunctional } from '@/lib/automations/recompute'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'

type BranchOption = { key: string; next_step_id?: string | null; [key: string]: unknown }

function remapConfigNextSteps(config: unknown, idMap: Map<string, string>): Json {
  if (typeof config !== 'object' || config === null || !Array.isArray((config as { options?: unknown }).options)) {
    return config as Json
  }
  const options = (config as { options: BranchOption[] }).options.map((option) => {
    if (option.next_step_id && idMap.has(option.next_step_id)) {
      return { ...option, next_step_id: idMap.get(option.next_step_id) }
    }
    return option
  })
  return { ...(config as Record<string, unknown>), options } as Json
}

// A real dependency-graph clone, not a shallow copy: steps reference each other
// via next_step_id (and, for branching types, config.options[].next_step_id), so
// every internal reference has to be remapped to the newly-created step ids.
// Cross-automation triggers (automation_template_step_triggers.target_template_id)
// and a step_completed trigger pointing at a step outside this template are left
// pointing at the same targets as the original -- duplicating a template
// shouldn't rewire what it points at.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: original } = await supabase.from('automation_templates').select('*').eq('id', id).single()
  if (!original || original.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: steps } = await supabase
    .from('automation_template_steps')
    .select('*')
    .eq('template_id', id)
    .order('step_number')

  const { data: triggers } = steps && steps.length
    ? await supabase
        .from('automation_template_step_triggers')
        .select('*')
        .in(
          'step_id',
          steps.map((step) => step.id)
        )
    : { data: [] }

  const { data: newTemplate, error: templateError } = await supabase
    .from('automation_templates')
    .insert({
      company_id: original.company_id,
      name: `${original.name} (Copy)`,
      trigger_type: original.trigger_type,
      trigger_deal_type_id: original.trigger_deal_type_id,
      trigger_deal_field: original.trigger_deal_field,
      trigger_custom_field_id: original.trigger_custom_field_id,
      trigger_source_step_id: original.trigger_source_step_id,
      trigger_date_field: original.trigger_date_field,
      trigger_date_direction: original.trigger_date_direction,
      trigger_date_offset_days: original.trigger_date_offset_days,
      start_delay_days: original.start_delay_days,
      first_step_due_delay_days: original.first_step_due_delay_days,
    })
    .select('id')
    .single()

  if (templateError || !newTemplate) {
    return NextResponse.json({ error: templateError?.message ?? 'Could not duplicate automation.' }, { status: 400 })
  }

  if (!steps || steps.length === 0) {
    return NextResponse.json({ id: newTemplate.id })
  }

  // Pass 1: insert every step with next_step_id left null for now (its real
  // value depends on ids that don't exist until this pass completes).
  const idMap = new Map<string, string>()
  for (const step of steps) {
    const { data: newStep, error: stepError } = await supabase
      .from('automation_template_steps')
      .insert({
        template_id: newTemplate.id,
        step_number: step.step_number,
        step_type: step.step_type,
        name: step.name,
        description: step.description,
        config: step.config,
        assigned_role_id: step.assigned_role_id,
        assigned_profile_id: step.assigned_profile_id,
        next_step_id: null,
        next_step_due_delay_days: step.next_step_due_delay_days,
        completes_automator: step.completes_automator,
        is_operational: step.is_operational,
      })
      .select('id')
      .single()
    if (stepError || !newStep) {
      return NextResponse.json({ error: stepError?.message ?? 'Could not duplicate a step.' }, { status: 400 })
    }
    idMap.set(step.id, newStep.id)
  }

  // Pass 2: now that every new step id is known, remap next_step_id (top-level
  // and, for branching types, inside config.options[]) and write it in.
  for (const step of steps) {
    const newId = idMap.get(step.id)
    if (!newId) continue

    const newNextStepId = step.next_step_id ? idMap.get(step.next_step_id) ?? null : null
    const newConfig = remapConfigNextSteps(step.config, idMap)

    const { error: updateError } = await supabase
      .from('automation_template_steps')
      .update({ next_step_id: newNextStepId, config: newConfig })
      .eq('id', newId)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }
  }

  if (triggers && triggers.length > 0) {
    const newTriggers = triggers
      .map((trigger) => {
        const newStepId = idMap.get(trigger.step_id)
        if (!newStepId) return null
        return { step_id: newStepId, option_key: trigger.option_key, target_template_id: trigger.target_template_id }
      })
      .filter((trigger): trigger is NonNullable<typeof trigger> => trigger !== null)

    if (newTriggers.length > 0) {
      const { error: triggersError } = await supabase.from('automation_template_step_triggers').insert(newTriggers)
      if (triggersError) {
        return NextResponse.json({ error: triggersError.message }, { status: 400 })
      }
    }
  }

  await recomputeTemplateFunctional(supabase, newTemplate.id)

  return NextResponse.json({ id: newTemplate.id })
}
