export type LookupOption = { id: string; name: string }
export type CustomFieldOption = { id: string; name: string; field_type: string }
export type OtherStepOption = { id: string; name: string | null; template_id: string }

export type AutomationTemplate = {
  id: string
  name: string
  trigger_type: string
  trigger_deal_type_id: string | null
  trigger_deal_field: string | null
  trigger_custom_field_id: string | null
  trigger_source_step_id: string | null
  trigger_date_field: string | null
  trigger_date_direction: string | null
  trigger_date_offset_days: number | null
  start_delay_days: number
  first_step_due_delay_days: number
  is_functional: boolean
}

export type AutomationStep = {
  id: string
  template_id: string
  step_number: number
  step_type: string | null
  name: string | null
  description: string | null
  config: unknown
  assigned_role_id: string | null
  assigned_profile_id: string | null
  next_step_id: string | null
  next_step_due_delay_days: number | null
  completes_automator: boolean
  is_operational: boolean
}

export type StepTrigger = {
  id: string
  step_id: string
  option_key: string | null
  target_template_id: string
}

export type BranchOption = {
  key: string
  label: string
  next_step_id: string | null
  completes_automator: boolean
  next_step_due_delay_days: number | null
}

export type SimpleOption = { key: string; label: string }

export type FillFieldsConfig = { deal_fields: string[]; custom_field_ids: string[] }
export type ConditionalStatementConfig = { question: string; options: BranchOption[] }
export type OptionListConfig = { choice_mode: 'single' | 'multiple'; options: (BranchOption | SimpleOption)[] }
