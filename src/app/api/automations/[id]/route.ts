import { NextResponse } from 'next/server'

import { isValidDealDateField, isValidDealField } from '@/lib/automations/deal-fields'
import { recomputeTemplateFunctional } from '@/lib/automations/recompute'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const TRIGGER_TYPES = ['deal_created', 'field_changed', 'custom_field_changed', 'step_completed', 'date_based']

type TriggerFields = {
  trigger_type: string
  trigger_deal_type_id: string | null
  trigger_deal_field: string | null
  trigger_custom_field_id: string | null
  trigger_source_step_id: string | null
  trigger_date_field: string | null
  trigger_date_direction: string | null
  trigger_date_offset_days: number | null
}

// Mirrors automation_templates_trigger_shape's CHECK constraint at the app layer,
// so a bad trigger config comes back as a friendly 400 instead of a raw
// constraint-violation error.
async function buildTriggerFields(
  supabase: SupabaseClient<Database>,
  companyId: string,
  templateId: string,
  body: Record<string, unknown>
): Promise<{ ok: true; fields: TriggerFields } | { ok: false; error: string }> {
  const triggerType = typeof body.trigger_type === 'string' ? body.trigger_type : ''
  if (!TRIGGER_TYPES.includes(triggerType)) {
    return { ok: false, error: 'Choose a valid trigger.' }
  }

  const empty: TriggerFields = {
    trigger_type: triggerType,
    trigger_deal_type_id: null,
    trigger_deal_field: null,
    trigger_custom_field_id: null,
    trigger_source_step_id: null,
    trigger_date_field: null,
    trigger_date_direction: null,
    trigger_date_offset_days: null,
  }

  if (triggerType === 'deal_created') {
    const dealTypeId = typeof body.trigger_deal_type_id === 'string' ? body.trigger_deal_type_id : null
    if (dealTypeId) {
      const { data } = await supabase.from('deal_types').select('id').eq('id', dealTypeId).eq('company_id', companyId).single()
      if (!data) return { ok: false, error: 'That deal type was not found.' }
    }
    return { ok: true, fields: { ...empty, trigger_deal_type_id: dealTypeId } }
  }

  if (triggerType === 'field_changed') {
    const field = body.trigger_deal_field
    if (!isValidDealField(field)) {
      return { ok: false, error: 'Choose a valid deal field.' }
    }
    return { ok: true, fields: { ...empty, trigger_deal_field: field } }
  }

  if (triggerType === 'custom_field_changed') {
    const customFieldId = typeof body.trigger_custom_field_id === 'string' ? body.trigger_custom_field_id : ''
    if (!customFieldId) return { ok: false, error: 'Choose a custom field.' }
    const { data } = await supabase
      .from('custom_field_definitions')
      .select('id')
      .eq('id', customFieldId)
      .eq('company_id', companyId)
      .single()
    if (!data) return { ok: false, error: 'That custom field was not found.' }
    return { ok: true, fields: { ...empty, trigger_custom_field_id: customFieldId } }
  }

  if (triggerType === 'step_completed') {
    const sourceStepId = typeof body.trigger_source_step_id === 'string' ? body.trigger_source_step_id : ''
    if (!sourceStepId) return { ok: false, error: 'Choose which automation and step starts this one.' }
    const { data: sourceStep } = await supabase
      .from('automation_template_steps')
      .select('id, template_id')
      .eq('id', sourceStepId)
      .single()
    if (!sourceStep) return { ok: false, error: 'That step was not found.' }
    if (sourceStep.template_id === templateId) {
      return { ok: false, error: 'Choose a step from a different automation.' }
    }
    const { data: sourceTemplate } = await supabase
      .from('automation_templates')
      .select('id')
      .eq('id', sourceStep.template_id)
      .eq('company_id', companyId)
      .single()
    if (!sourceTemplate) return { ok: false, error: 'That step was not found.' }
    return { ok: true, fields: { ...empty, trigger_source_step_id: sourceStepId } }
  }

  // date_based
  const dateField = body.trigger_date_field
  const direction = typeof body.trigger_date_direction === 'string' ? body.trigger_date_direction : ''
  const offsetDays = Number(body.trigger_date_offset_days ?? 0)
  if (!isValidDealDateField(dateField)) {
    return { ok: false, error: 'Choose a valid date field.' }
  }
  if (!['on', 'before', 'after'].includes(direction)) {
    return { ok: false, error: 'Choose on, before, or after the date.' }
  }
  if (!Number.isFinite(offsetDays) || offsetDays < 0) {
    return { ok: false, error: 'Enter a valid number of days.' }
  }
  return {
    ok: true,
    fields: { ...empty, trigger_date_field: dateField, trigger_date_direction: direction, trigger_date_offset_days: offsetDays },
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const startDelayDays = Number(body.start_delay_days ?? 0)
  const firstStepDueDelayDays = Number(body.first_step_due_delay_days ?? 0)
  if (!Number.isFinite(startDelayDays) || startDelayDays < 0 || !Number.isFinite(firstStepDueDelayDays) || firstStepDueDelayDays < 0) {
    return NextResponse.json({ error: 'Enter valid numbers of days.' }, { status: 400 })
  }

  const triggerResult = await buildTriggerFields(supabase, profile.company_id, id, body)
  if (!triggerResult.ok) {
    return NextResponse.json({ error: triggerResult.error }, { status: 400 })
  }

  const folderId = typeof body.folder_id === 'string' && body.folder_id ? body.folder_id : null
  if (folderId) {
    const { data: folder } = await supabase.from('automation_folders').select('company_id').eq('id', folderId).single()
    if (!folder || folder.company_id !== profile.company_id) {
      return NextResponse.json({ error: 'That folder was not found.' }, { status: 400 })
    }
  }

  const { error } = await supabase
    .from('automation_templates')
    .update({
      name,
      folder_id: folderId,
      start_delay_days: startDelayDays,
      first_step_due_delay_days: firstStepDueDelayDays,
      ...triggerResult.fields,
    })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const isFunctional = await recomputeTemplateFunctional(supabase, id)
  return NextResponse.json({ id, is_functional: isFunctional })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const { data: existing } = await supabase.from('automation_templates').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // Deleting this template would cascade-delete its steps, which would in turn
  // SET NULL any other template's trigger_source_step_id pointing at one of
  // them -- violating automation_templates_trigger_shape's requirement that a
  // step_completed trigger always have a source step. Block with a friendly
  // message instead of surfacing that as a raw constraint error.
  const { data: ownSteps } = await supabase.from('automation_template_steps').select('id').eq('template_id', id)
  const ownStepIds = (ownSteps ?? []).map((row) => row.id)

  if (ownStepIds.length > 0) {
    const { data: blockers } = await supabase
      .from('automation_templates')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('trigger_type', 'step_completed')
      .in('trigger_source_step_id', ownStepIds)
      .neq('id', id)

    if (blockers && blockers.length > 0) {
      return NextResponse.json(
        {
          error: `Other automations start when a step here finishes: ${blockers.map((row) => row.name).join(', ')}. Change their trigger first.`,
        },
        { status: 409 }
      )
    }
  }

  const { error } = await supabase.from('automation_templates').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id })
}
