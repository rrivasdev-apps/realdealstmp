import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { buildCustomFieldsForSave } from '@/lib/deals/custom-fields'
import type { Database, Json } from '@/lib/supabase/database.types'

import { DEAL_FIELDS, type DealField } from './deal-fields'
import type { BranchOption, SimpleOption } from './step-config'

type SupaClient = SupabaseClient<Database>

function todayPlusDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

async function logActivity(
  supabase: SupaClient,
  processId: string,
  eventType: string,
  detail?: Record<string, unknown> | null,
  actorProfileId?: string | null
) {
  await supabase.from('automation_activity_log').insert({
    process_id: processId,
    event_type: eventType,
    detail: (detail ?? null) as Json,
    actor_profile_id: actorProfileId ?? null,
  })
}

// Specific-user case is a single profile. Role case resolves to every profile
// currently holding that role -- query-time, not frozen at process/step-creation --
// via the same reverse profile_employee_roles lookup already used in
// src/app/api/employee-roles/[id]/route.ts.
export async function resolveStepAssignees(
  supabase: SupaClient,
  step: { assigned_role_id: string | null; assigned_profile_id: string | null }
): Promise<string[]> {
  if (step.assigned_profile_id) return [step.assigned_profile_id]
  if (step.assigned_role_id) {
    const { data } = await supabase.from('profile_employee_roles').select('profile_id').eq('employee_role_id', step.assigned_role_id)
    return (data ?? []).map((row) => row.profile_id)
  }
  return []
}

// Silently no-ops (returns the existing process) if one is already
// pending_start/running for this template+deal pair -- backed by
// automation_processes_active_template_deal_idx, so a bouncing field_changed
// trigger or a re-fired path can't spawn duplicates.
export async function startProcess(
  supabase: SupaClient,
  { templateId, dealId, startedManually }: { templateId: string; dealId: string; startedManually: boolean }
): Promise<{ id: string } | null> {
  const { data: template } = await supabase
    .from('automation_templates')
    .select('id, is_functional, start_delay_days')
    .eq('id', templateId)
    .single()
  if (!template || !template.is_functional) return null

  const { data: process, error } = await supabase
    .from('automation_processes')
    .insert({ template_id: templateId, deal_id: dealId, started_manually: startedManually })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('automation_processes')
        .select('id')
        .eq('template_id', templateId)
        .eq('deal_id', dealId)
        .neq('status', 'completed')
        .maybeSingle()
      return existing ?? null
    }
    return null
  }
  if (!process) return null

  await logActivity(supabase, process.id, 'process_triggered', { started_manually: startedManually })

  if (template.start_delay_days === 0) {
    await activateProcess(supabase, process.id)
  }

  return process
}

// Flips a pending_start process to running and creates its first step (the
// template step currently at step_number = 1 -- see the plan's note on why
// there's no separate "entry point" column). No-ops for anything already past
// pending_start (defensive -- Milestone 3's cron will call this too).
export async function activateProcess(supabase: SupaClient, processId: string): Promise<void> {
  const { data: process } = await supabase.from('automation_processes').select('id, status, template_id').eq('id', processId).single()
  if (!process || process.status !== 'pending_start') return

  const [{ data: template }, { data: firstStep }] = await Promise.all([
    supabase.from('automation_templates').select('first_step_due_delay_days').eq('id', process.template_id).single(),
    supabase.from('automation_template_steps').select('id').eq('template_id', process.template_id).eq('step_number', 1).single(),
  ])
  if (!template || !firstStep) return

  await supabase.from('automation_processes').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', processId)

  const { data: step } = await supabase
    .from('automation_steps')
    .insert({ process_id: processId, template_step_id: firstStep.id, due_at: todayPlusDays(template.first_step_due_delay_days) })
    .select('id')
    .single()

  await logActivity(supabase, processId, 'process_started')
  if (step) await logActivity(supabase, processId, 'step_due', { automation_step_id: step.id })
}

function coerceDealFieldValue(field: DealField, raw: unknown): string | number | boolean | null {
  if (raw === undefined || raw === null || raw === '') return null
  if (field.type === 'checkbox') return Boolean(raw)
  if (field.type === 'number') {
    const num = Number(raw)
    return Number.isFinite(num) ? num : null
  }
  return String(raw)
}

type ResolvedOutcome = { nextStepId: string | null; completesAutomator: boolean; nextStepDueDelayDays: number | null }

async function fireStepTriggers(
  supabase: SupaClient,
  { templateStepId, optionKey, dealId }: { templateStepId: string; optionKey: string | null; dealId: string }
) {
  const targetIds = new Set<string>()

  const { data: stepLevelTriggers } = await supabase
    .from('automation_template_step_triggers')
    .select('target_template_id')
    .eq('step_id', templateStepId)
    .is('option_key', null)
  for (const row of stepLevelTriggers ?? []) targetIds.add(row.target_template_id)

  if (optionKey) {
    const { data: optionTriggers } = await supabase
      .from('automation_template_step_triggers')
      .select('target_template_id')
      .eq('step_id', templateStepId)
      .eq('option_key', optionKey)
    for (const row of optionTriggers ?? []) targetIds.add(row.target_template_id)
  }

  // The other representation of the same relationship: a template that
  // declares "start me when this step finishes" via its own trigger config,
  // rather than the step declaring "trigger this template on completion."
  const { data: declaredTriggerTemplates } = await supabase
    .from('automation_templates')
    .select('id')
    .eq('trigger_type', 'step_completed')
    .eq('trigger_source_step_id', templateStepId)
    .eq('is_functional', true)
  for (const row of declaredTriggerTemplates ?? []) targetIds.add(row.id)

  for (const templateId of targetIds) {
    await startProcess(supabase, { templateId, dealId, startedManually: false })
  }
}

export type CompleteStepInput = {
  automationStepId: string
  actingProfileId: string
  companyId: string
  fieldValues?: Record<string, unknown>
  selectedOptionKey?: string
  selectedOptionKeys?: string[]
}

export type CompleteStepResult = { ok: true } | { ok: false; error: string }

// The runtime's core state machine -- every completion route calls into this,
// none duplicate it. See the plan's "Fires cross-automation triggers" /
// "Resolves the next step" ordering for why these run in this order.
export async function completeStep(supabase: SupaClient, input: CompleteStepInput): Promise<CompleteStepResult> {
  const { data: step } = await supabase.from('automation_steps').select('*').eq('id', input.automationStepId).single()
  if (!step) return { ok: false, error: 'Step not found.' }
  if (step.status === 'completed') return { ok: false, error: 'This step is already completed.' }

  const { data: templateStep } = await supabase.from('automation_template_steps').select('*').eq('id', step.template_step_id).single()
  if (!templateStep) return { ok: false, error: "This step's definition was not found." }

  const { data: process } = await supabase.from('automation_processes').select('*').eq('id', step.process_id).single()
  if (!process) return { ok: false, error: 'Process not found.' }

  const config = (templateStep.config ?? {}) as Record<string, unknown>
  let resolvedOptionKey: string | null = null
  let fieldUpdatesSnapshot: Record<string, unknown> | null = null
  let outcome: ResolvedOutcome = {
    nextStepId: templateStep.next_step_id,
    completesAutomator: templateStep.completes_automator,
    nextStepDueDelayDays: templateStep.next_step_due_delay_days,
  }

  const isSingleChoiceOptionList = templateStep.step_type === 'option_list' && config.choice_mode === 'single'

  if (templateStep.step_type === 'fill_fields') {
    const dealFieldKeys: string[] = Array.isArray(config.deal_fields) ? (config.deal_fields as string[]) : []
    const customFieldIds: string[] = Array.isArray(config.custom_field_ids) ? (config.custom_field_ids as string[]) : []
    const values = input.fieldValues ?? {}

    const dealUpdate: Record<string, unknown> = {}
    for (const key of dealFieldKeys) {
      const field = DEAL_FIELDS.find((candidate) => candidate.key === key)
      if (!field) continue
      dealUpdate[key] = coerceDealFieldValue(field, values[key])
    }

    if (customFieldIds.length > 0) {
      const { data: deal } = await supabase.from('deals').select('custom_fields').eq('id', process.deal_id).single()
      const existingCustomFields = (deal?.custom_fields ?? {}) as Record<string, unknown>
      const mergedRaw: Record<string, unknown> = { ...existingCustomFields }
      for (const definitionId of customFieldIds) {
        const raw = values[`custom:${definitionId}`]
        if (raw !== undefined) mergedRaw[definitionId] = raw
      }
      dealUpdate.custom_fields = await buildCustomFieldsForSave(supabase, input.companyId, mergedRaw)
    }

    if (Object.keys(dealUpdate).length > 0) {
      const { error: dealError } = await supabase
        .from('deals')
        .update(dealUpdate as Database['public']['Tables']['deals']['Update'])
        .eq('id', process.deal_id)
      if (dealError) return { ok: false, error: dealError.message }
    }

    fieldUpdatesSnapshot = dealUpdate
  } else if (templateStep.step_type === 'conditional_statement' || isSingleChoiceOptionList) {
    const options = Array.isArray(config.options) ? (config.options as BranchOption[]) : []
    const selected = options.find((option) => option.key === input.selectedOptionKey)
    if (!selected) return { ok: false, error: 'Choose a valid option.' }
    resolvedOptionKey = selected.key
    outcome = {
      nextStepId: selected.next_step_id,
      completesAutomator: selected.completes_automator,
      nextStepDueDelayDays: selected.next_step_due_delay_days,
    }
  } else if (templateStep.step_type === 'option_list') {
    const options = Array.isArray(config.options) ? (config.options as SimpleOption[]) : []
    const validKeys = new Set(options.map((option) => option.key))
    const selectedKeys = (input.selectedOptionKeys ?? []).filter((key) => validKeys.has(key))
    if (selectedKeys.length > 0) {
      await supabase
        .from('automation_step_options')
        .insert(selectedKeys.map((option_key) => ({ automation_step_id: step.id, option_key })))
    }
  }
  // email_task/call_task/generic_task/show_text/trigger: nothing to apply,
  // `outcome` already defaults to the step's own top-level columns.

  await supabase
    .from('automation_steps')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by_profile_id: input.actingProfileId,
      selected_option_key: resolvedOptionKey,
      field_updates: fieldUpdatesSnapshot as Json,
    })
    .eq('id', step.id)

  await logActivity(
    supabase,
    process.id,
    'step_completed',
    { automation_step_id: step.id, template_step_id: templateStep.id, selected_option_key: resolvedOptionKey, field_updates: fieldUpdatesSnapshot },
    input.actingProfileId
  )

  await fireStepTriggers(supabase, { templateStepId: templateStep.id, optionKey: resolvedOptionKey, dealId: process.deal_id })

  if (outcome.completesAutomator) {
    await supabase.from('automation_processes').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', process.id)
    await logActivity(supabase, process.id, 'process_completed')
  } else if (outcome.nextStepId) {
    const { data: nextStep } = await supabase
      .from('automation_steps')
      .insert({
        process_id: process.id,
        template_step_id: outcome.nextStepId,
        due_at: todayPlusDays(outcome.nextStepDueDelayDays ?? 0),
      })
      .select('id')
      .single()
    if (nextStep) await logActivity(supabase, process.id, 'step_due', { automation_step_id: nextStep.id })
  }

  return { ok: true }
}

export async function evaluateTriggersForDealCreated(
  supabase: SupaClient,
  deal: { id: string; company_id: string; deal_type_id: string | null }
): Promise<void> {
  const { data: templates } = await supabase
    .from('automation_templates')
    .select('id, trigger_deal_type_id')
    .eq('company_id', deal.company_id)
    .eq('trigger_type', 'deal_created')
    .eq('is_functional', true)

  for (const template of templates ?? []) {
    if (template.trigger_deal_type_id && template.trigger_deal_type_id !== deal.deal_type_id) continue
    await startProcess(supabase, { templateId: template.id, dealId: deal.id, startedManually: false })
  }
}

export async function evaluateTriggersForDealUpdated(
  supabase: SupaClient,
  companyId: string,
  dealId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Promise<void> {
  const { data: templates } = await supabase
    .from('automation_templates')
    .select('id, trigger_type, trigger_deal_field, trigger_custom_field_id')
    .eq('company_id', companyId)
    .in('trigger_type', ['field_changed', 'custom_field_changed'])
    .eq('is_functional', true)

  for (const template of templates ?? []) {
    if (template.trigger_type === 'field_changed' && template.trigger_deal_field) {
      if (before[template.trigger_deal_field] !== after[template.trigger_deal_field]) {
        await startProcess(supabase, { templateId: template.id, dealId, startedManually: false })
      }
    } else if (template.trigger_type === 'custom_field_changed' && template.trigger_custom_field_id) {
      const beforeCustom = (before.custom_fields ?? {}) as Record<string, unknown>
      const afterCustom = (after.custom_fields ?? {}) as Record<string, unknown>
      if (beforeCustom[template.trigger_custom_field_id] !== afterCustom[template.trigger_custom_field_id]) {
        await startProcess(supabase, { templateId: template.id, dealId, startedManually: false })
      }
    }
  }
}
