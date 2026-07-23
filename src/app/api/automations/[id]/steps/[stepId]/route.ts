import { NextResponse } from 'next/server'

import { validateAssignee } from '@/lib/automations/assignee'
import { recomputeStepOperational, recomputeTemplateFunctional } from '@/lib/automations/recompute'
import { buildStepConfigForSave, isValidStepType, type StepType } from '@/lib/automations/step-config'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type TriggerInput = { option_key: string | null; target_template_ids: string[] }

function collectOptionKeys(stepType: string | null, config: unknown): Set<string> {
  if (stepType !== 'conditional_statement' && stepType !== 'option_list') return new Set()
  const options = (config as { options?: { key?: string }[] } | null)?.options
  if (!Array.isArray(options)) return new Set()
  return new Set(options.map((option) => option.key).filter((key): key is string => typeof key === 'string'))
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  const { id, stepId } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: template } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!template || template.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: step } = await supabase.from('automation_template_steps').select('*').eq('id', stepId).eq('template_id', id).single()
  if (!step) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const updates: Database['public']['Tables']['automation_template_steps']['Update'] = {}

  // A step's type is set once, the first time an action is dropped onto it --
  // it becomes that step's action for good after that.
  let effectiveStepType: StepType | null = step.step_type as StepType | null
  if (body.step_type !== undefined) {
    if (step.step_type && body.step_type !== step.step_type) {
      return NextResponse.json({ error: "A step's type can't be changed once set." }, { status: 400 })
    }
    if (!step.step_type) {
      if (!isValidStepType(body.step_type)) {
        return NextResponse.json({ error: 'Choose a valid action type.' }, { status: 400 })
      }
      effectiveStepType = body.step_type
      updates.step_type = body.step_type
    }
  }

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) return NextResponse.json({ error: 'This step needs a title.' }, { status: 400 })
    updates.name = name
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === 'string' ? body.description : null
  }

  if ('assigned_role_id' in body || 'assigned_profile_id' in body) {
    const assigneeResult = await validateAssignee(supabase, profile.company_id, {
      assigned_role_id: body.assigned_role_id,
      assigned_profile_id: body.assigned_profile_id,
    })
    if (!assigneeResult.ok) {
      return NextResponse.json({ error: assigneeResult.error }, { status: 400 })
    }
    updates.assigned_role_id = assigneeResult.assigned_role_id
    updates.assigned_profile_id = assigneeResult.assigned_profile_id
  }

  if (body.next_step_id !== undefined || body.completes_automator !== undefined) {
    const completesAutomator = Boolean(body.completes_automator ?? step.completes_automator)
    const nextStepId =
      body.next_step_id !== undefined ? (typeof body.next_step_id === 'string' ? body.next_step_id : null) : step.next_step_id

    if (completesAutomator === Boolean(nextStepId)) {
      return NextResponse.json(
        { error: 'This step must either go to another step or complete the automation.' },
        { status: 400 }
      )
    }

    if (nextStepId) {
      if (nextStepId === stepId) {
        return NextResponse.json({ error: 'A step cannot point to itself.' }, { status: 400 })
      }
      const { data: target } = await supabase
        .from('automation_template_steps')
        .select('id')
        .eq('id', nextStepId)
        .eq('template_id', id)
        .single()
      if (!target) {
        return NextResponse.json({ error: "That step isn't part of this automation." }, { status: 400 })
      }
      const dueDelayDays = Number(body.next_step_due_delay_days ?? step.next_step_due_delay_days ?? 0)
      if (!Number.isFinite(dueDelayDays) || dueDelayDays < 0) {
        return NextResponse.json({ error: 'Enter a valid number of days until the next step is due.' }, { status: 400 })
      }
      updates.next_step_id = nextStepId
      updates.next_step_due_delay_days = dueDelayDays
      updates.completes_automator = false
    } else {
      updates.next_step_id = null
      updates.next_step_due_delay_days = null
      updates.completes_automator = true
    }
  }

  if (body.config !== undefined) {
    if (!effectiveStepType) {
      return NextResponse.json({ error: 'Pick an action type for this step first.' }, { status: 400 })
    }
    const configResult = await buildStepConfigForSave(supabase, profile.company_id, id, stepId, effectiveStepType, body.config)
    if (!configResult.ok) {
      return NextResponse.json({ error: configResult.error }, { status: 400 })
    }
    updates.config = configResult.config as Database['public']['Tables']['automation_template_steps']['Update']['config']
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('automation_template_steps').update(updates).eq('id', stepId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  // Rebuild this step's "trigger another automation" wiring from scratch --
  // never trust an incremental client diff, same posture as buildCustomFieldsForSave.
  if (Array.isArray(body.triggers)) {
    const rawTriggers = body.triggers as TriggerInput[]
    const effectiveConfig = updates.config ?? step.config
    const validOptionKeys = collectOptionKeys(effectiveStepType, effectiveConfig)

    const allTargetIds = Array.from(new Set(rawTriggers.flatMap((trigger) => trigger.target_template_ids ?? [])))
    const { data: validTargets } =
      allTargetIds.length > 0
        ? await supabase.from('automation_templates').select('id').eq('company_id', profile.company_id).in('id', allTargetIds)
        : { data: [] }
    const validTargetIds = new Set((validTargets ?? []).map((row) => row.id))

    const rowsToInsert: { step_id: string; option_key: string | null; target_template_id: string }[] = []
    for (const trigger of rawTriggers) {
      const optionKey = trigger.option_key ?? null
      if (optionKey !== null && !validOptionKeys.has(optionKey)) {
        return NextResponse.json({ error: 'That option is no longer part of this step.' }, { status: 400 })
      }
      for (const targetId of trigger.target_template_ids ?? []) {
        if (!validTargetIds.has(targetId)) {
          return NextResponse.json({ error: 'One of the selected automations was not found.' }, { status: 400 })
        }
        rowsToInsert.push({ step_id: stepId, option_key: optionKey, target_template_id: targetId })
      }
    }

    const { error: deleteError } = await supabase.from('automation_template_step_triggers').delete().eq('step_id', stepId)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }
    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase.from('automation_template_step_triggers').insert(rowsToInsert)
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }
  }

  const isOperational = await recomputeStepOperational(supabase, stepId)
  const isFunctional = await recomputeTemplateFunctional(supabase, id)

  return NextResponse.json({ id: stepId, is_operational: isOperational, is_functional: isFunctional })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { id, stepId } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: template } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!template || template.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { data: siblingSteps } = await supabase
    .from('automation_template_steps')
    .select('id, name, next_step_id, config')
    .eq('template_id', id)
    .neq('id', stepId)

  const blockingStepNames = (siblingSteps ?? [])
    .filter((sibling) => {
      if (sibling.next_step_id === stepId) return true
      const options = (sibling.config as { options?: { next_step_id?: string | null }[] } | null)?.options
      return Array.isArray(options) && options.some((option) => option.next_step_id === stepId)
    })
    .map((sibling) => sibling.name ?? 'Untitled step')

  const { data: blockingTemplates } = await supabase
    .from('automation_templates')
    .select('name')
    .eq('trigger_source_step_id', stepId)

  const blockers = [...blockingStepNames, ...(blockingTemplates ?? []).map((row) => `${row.name} (trigger)`)]

  if (blockers.length > 0) {
    return NextResponse.json(
      { error: `Other steps or automations point to this one: ${blockers.join(', ')}. Repoint them first.` },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('automation_template_steps').delete().eq('id', stepId).eq('template_id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Close the gap left in step_number so the remaining list displays 1..N
  // without a hole -- two passes (offset, then final) since each supabase-js
  // call is its own transaction and a single pass could transiently collide
  // with another row's still-unmoved step_number.
  const { data: remaining } = await supabase
    .from('automation_template_steps')
    .select('id')
    .eq('template_id', id)
    .order('step_number')

  if (remaining && remaining.length > 0) {
    await Promise.all(
      remaining.map((row, index) => supabase.from('automation_template_steps').update({ step_number: index + 100000 }).eq('id', row.id))
    )
    await Promise.all(
      remaining.map((row, index) => supabase.from('automation_template_steps').update({ step_number: index + 1 }).eq('id', row.id))
    )
  }

  const isFunctional = await recomputeTemplateFunctional(supabase, id)
  return NextResponse.json({ id: stepId, is_functional: isFunctional })
}
