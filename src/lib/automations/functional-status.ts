// Pure functions -- no I/O -- following the calculateProfitCascade idiom
// (src/lib/deals/profit.ts): plain structural input, called from every route that
// mutates a template's steps or general settings, which then persists the
// recomputed value in the same request. This is the "Automation Functional/Not
// Functional" and "Step Operational/Not Operational" badges from the reference
// doc, computed server-side rather than trusted from the client.
export type StepForOperationalCheck = {
  step_type: string | null
  name: string | null
  assigned_role_id: string | null
  assigned_profile_id: string | null
  next_step_id: string | null
  completes_automator: boolean
  config: unknown
}

function hasResolvedNextStep(nextStepId: string | null, completesAutomator: boolean): boolean {
  return Boolean(nextStepId) !== completesAutomator
}

export function computeStepOperational(step: StepForOperationalCheck): boolean {
  if (!step.step_type) return false
  if (!step.name?.trim()) return false
  if (Boolean(step.assigned_role_id) === Boolean(step.assigned_profile_id)) return false

  const config = (step.config ?? {}) as Record<string, unknown>

  switch (step.step_type) {
    case 'conditional_statement':
      return Boolean(config.question) && Array.isArray(config.options) && config.options.length === 2
    case 'option_list': {
      if (!config.choice_mode || !Array.isArray(config.options) || config.options.length === 0) return false
      if (config.choice_mode === 'multiple') {
        return hasResolvedNextStep(step.next_step_id, step.completes_automator)
      }
      return true
    }
    case 'fill_fields': {
      const dealFields = Array.isArray(config.deal_fields) ? config.deal_fields : []
      const customFieldIds = Array.isArray(config.custom_field_ids) ? config.custom_field_ids : []
      const hasFields = dealFields.length > 0 || customFieldIds.length > 0
      return hasFields && hasResolvedNextStep(step.next_step_id, step.completes_automator)
    }
    default:
      return hasResolvedNextStep(step.next_step_id, step.completes_automator)
  }
}

export function computeTemplateFunctional(steps: StepForOperationalCheck[]): boolean {
  return steps.length > 0 && steps.every((step) => computeStepOperational(step))
}
