import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { isValidDealField } from './deal-fields'

export const STEP_TYPES = [
  'fill_fields',
  'conditional_statement',
  'email_task',
  'call_task',
  'generic_task',
  'show_text',
  'option_list',
  'trigger',
] as const

export type StepType = (typeof STEP_TYPES)[number]

export function isValidStepType(value: unknown): value is StepType {
  return typeof value === 'string' && (STEP_TYPES as readonly string[]).includes(value)
}

// The shared "what happens next" shape, used once per non-branching step and once
// per branch on the two branching step types.
export type BranchOption = {
  key: string
  label: string
  next_step_id: string | null
  completes_automator: boolean
  next_step_due_delay_days: number | null
}

export type SimpleOption = { key: string; label: string }

export type StepConfigResult = { ok: true; config: Record<string, unknown> } | { ok: false; error: string }

function parseBranchOption(
  raw: unknown,
  stepIdsInTemplate: Set<string>
): { ok: true; option: BranchOption } | { ok: false; error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Each option needs a label.' }
  }
  const value = raw as Record<string, unknown>
  const key = typeof value.key === 'string' && value.key ? value.key : null
  const label = typeof value.label === 'string' ? value.label.trim() : ''
  if (!key || !label) {
    return { ok: false, error: 'Each option needs a label.' }
  }

  const completesAutomator = Boolean(value.completes_automator)
  const nextStepId = typeof value.next_step_id === 'string' ? value.next_step_id : null

  if (completesAutomator === Boolean(nextStepId)) {
    return { ok: false, error: `Option "${label}" must either go to another step or complete the automation.` }
  }
  if (nextStepId && !stepIdsInTemplate.has(nextStepId)) {
    return { ok: false, error: `Option "${label}" points to a step that isn't part of this automation.` }
  }

  const dueDelayDays = nextStepId ? Number(value.next_step_due_delay_days) : null
  if (nextStepId && (!Number.isFinite(dueDelayDays) || (dueDelayDays as number) < 0)) {
    return { ok: false, error: `Option "${label}" needs a valid number of days until the next step is due.` }
  }

  return {
    ok: true,
    option: {
      key,
      label,
      next_step_id: nextStepId,
      completes_automator: completesAutomator,
      next_step_due_delay_days: nextStepId ? (dueDelayDays as number) : null,
    },
  }
}

// Never trust the client's config payload directly -- reload what's needed to
// validate it (this template's other step ids, this company's custom field
// definitions) and rebuild the object from scratch, same posture as
// buildCustomFieldsForSave.
export async function buildStepConfigForSave(
  supabase: SupabaseClient<Database>,
  companyId: string,
  templateId: string,
  stepId: string,
  stepType: StepType,
  rawConfig: unknown
): Promise<StepConfigResult> {
  const input = typeof rawConfig === 'object' && rawConfig !== null ? (rawConfig as Record<string, unknown>) : {}

  if (
    stepType === 'email_task' ||
    stepType === 'call_task' ||
    stepType === 'generic_task' ||
    stepType === 'show_text' ||
    stepType === 'trigger'
  ) {
    return { ok: true, config: {} }
  }

  if (stepType === 'fill_fields') {
    const dealFields = Array.isArray(input.deal_fields) ? input.deal_fields.filter(isValidDealField) : []
    const customFieldIds = Array.isArray(input.custom_field_ids)
      ? input.custom_field_ids.filter((id): id is string => typeof id === 'string')
      : []

    let validCustomFieldIds: string[] = []
    if (customFieldIds.length > 0) {
      const { data } = await supabase
        .from('custom_field_definitions')
        .select('id')
        .eq('company_id', companyId)
        .in('id', customFieldIds)
      const validIds = new Set((data ?? []).map((row) => row.id))
      validCustomFieldIds = customFieldIds.filter((id) => validIds.has(id))
    }

    if (dealFields.length === 0 && validCustomFieldIds.length === 0) {
      return { ok: false, error: 'Select at least one deal field or custom field to update.' }
    }

    return { ok: true, config: { deal_fields: dealFields, custom_field_ids: validCustomFieldIds } }
  }

  // Both branching types need the set of other step ids in this template, to
  // validate next_step_id references.
  const { data: siblingSteps } = await supabase
    .from('automation_template_steps')
    .select('id')
    .eq('template_id', templateId)
    .neq('id', stepId)
  const stepIdsInTemplate = new Set((siblingSteps ?? []).map((row) => row.id))

  if (stepType === 'conditional_statement') {
    const question = typeof input.question === 'string' ? input.question.trim() : ''
    if (!question) {
      return { ok: false, error: 'A conditional statement needs a question.' }
    }
    const rawOptions = Array.isArray(input.options) ? input.options : []
    if (rawOptions.length !== 2) {
      return { ok: false, error: 'A conditional statement needs exactly two options.' }
    }

    const parsed: BranchOption[] = []
    for (const raw of rawOptions) {
      const result = parseBranchOption(raw, stepIdsInTemplate)
      if (!result.ok) return result
      parsed.push(result.option)
    }

    return { ok: true, config: { question, options: parsed } }
  }

  if (stepType === 'option_list') {
    const choiceMode = input.choice_mode === 'multiple' ? 'multiple' : input.choice_mode === 'single' ? 'single' : null
    if (!choiceMode) {
      return { ok: false, error: 'Choose whether this is single choice or multiple choice.' }
    }
    const rawOptions = Array.isArray(input.options) ? input.options : []
    if (rawOptions.length < 1 || rawOptions.length > 10) {
      return { ok: false, error: 'An option list needs between 1 and 10 options.' }
    }

    const seenKeys = new Set<string>()
    const options: (BranchOption | SimpleOption)[] = []
    for (const raw of rawOptions) {
      if (choiceMode === 'single') {
        const result = parseBranchOption(raw, stepIdsInTemplate)
        if (!result.ok) return result
        if (seenKeys.has(result.option.key)) return { ok: false, error: 'Option keys must be unique.' }
        seenKeys.add(result.option.key)
        options.push(result.option)
      } else {
        const value = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {}
        const key = typeof value.key === 'string' && value.key ? value.key : null
        const label = typeof value.label === 'string' ? value.label.trim() : ''
        if (!key || !label) return { ok: false, error: 'Each option needs a label.' }
        if (seenKeys.has(key)) return { ok: false, error: 'Option keys must be unique.' }
        seenKeys.add(key)
        options.push({ key, label })
      }
    }

    return { ok: true, config: { choice_mode: choiceMode, options } }
  }

  return { ok: false, error: 'Unknown step type.' }
}
