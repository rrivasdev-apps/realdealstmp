import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/lib/supabase/database.types'

import { computeStepOperational, computeTemplateFunctional } from './functional-status'

const STEP_SELECT = 'step_type, name, assigned_role_id, assigned_profile_id, next_step_id, completes_automator, config'

export async function recomputeStepOperational(supabase: SupabaseClient<Database>, stepId: string) {
  const { data: step } = await supabase.from('automation_template_steps').select(STEP_SELECT).eq('id', stepId).single()
  if (!step) return false
  const operational = computeStepOperational(step)
  await supabase.from('automation_template_steps').update({ is_operational: operational }).eq('id', stepId)
  return operational
}

export async function recomputeTemplateFunctional(supabase: SupabaseClient<Database>, templateId: string) {
  const { data: steps } = await supabase.from('automation_template_steps').select(STEP_SELECT).eq('template_id', templateId)
  const functional = computeTemplateFunctional(steps ?? [])
  await supabase.from('automation_templates').update({ is_functional: functional }).eq('id', templateId)
  return functional
}
