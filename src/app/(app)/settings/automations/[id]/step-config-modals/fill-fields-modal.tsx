'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'

import type { AutomationStep, CustomFieldOption, FillFieldsConfig, LookupOption, StepTrigger } from '../types'
import { AssigneeFields, initialAssigneeValue, initialNextStepValue, Modal, NextStepFields, TriggerAutomationFields } from './shared'

function FieldPickerList<T extends { key: string; label: string }>({
  label,
  options,
  selectedKeys,
  onChange,
}: {
  label: string
  options: T[]
  selectedKeys: string[]
  onChange: (keys: string[]) => void
}) {
  const available = options.filter((option) => !selectedKeys.includes(option.key))

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1 text-sm">
        {label}
        <select
          value=""
          onChange={(event) => {
            if (event.target.value) onChange([...selectedKeys, event.target.value])
          }}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          <option value="">Add field…</option>
          {available.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex max-h-32 flex-col gap-1 overflow-y-auto">
        {selectedKeys.map((key) => {
          const option = options.find((candidate) => candidate.key === key)
          return (
            <div key={key} className="flex items-center justify-between rounded border border-border px-3 py-1.5">
              <span>{option?.label ?? key}</span>
              <button
                type="button"
                onClick={() => onChange(selectedKeys.filter((existing) => existing !== key))}
                aria-label={`Remove ${option?.label ?? key}`}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function FillFieldsModal({
  templateId,
  step,
  allSteps,
  employeeRoles,
  profiles,
  customFieldDefinitions,
  otherTemplates,
  dealFields,
  triggers,
  onClose,
}: {
  templateId: string
  step: AutomationStep
  allSteps: AutomationStep[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  customFieldDefinitions: CustomFieldOption[]
  otherTemplates: LookupOption[]
  dealFields: DealField[]
  triggers: StepTrigger[]
  onClose: () => void
}) {
  const router = useRouter()
  const availableSteps = allSteps.filter((other) => other.id !== step.id)
  const existingConfig = (step.config ?? {}) as Partial<FillFieldsConfig>

  const [name, setName] = useState(step.name ?? '')
  const [dealFieldKeys, setDealFieldKeys] = useState(existingConfig.deal_fields ?? [])
  const [customFieldIds, setCustomFieldIds] = useState(existingConfig.custom_field_ids ?? [])
  const [assignee, setAssignee] = useState(
    initialAssigneeValue({ assigned_role_id: step.assigned_role_id, assigned_profile_id: step.assigned_profile_id }, employeeRoles)
  )
  const [nextStep, setNextStep] = useState(
    initialNextStepValue({
      next_step_id: step.next_step_id,
      completes_automator: step.completes_automator,
      next_step_due_delay_days: step.next_step_due_delay_days,
    })
  )
  const [targetIds, setTargetIds] = useState(triggers.filter((t) => t.option_key === null).map((t) => t.target_template_id))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const customFieldOptions = customFieldDefinitions.map((field) => ({ key: field.id, label: field.name }))

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        ...assignee,
        ...nextStep,
        config: { deal_fields: dealFieldKeys, custom_field_ids: customFieldIds },
        triggers: [{ option_key: null, target_template_ids: targetIds }],
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <Modal title="Update Fields" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />

        <label className="flex flex-col gap-1 text-sm">
          Task title
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <FieldPickerList
          label="Select deal fields to update"
          options={dealFields.map((field) => ({ key: field.key, label: field.label }))}
          selectedKeys={dealFieldKeys}
          onChange={setDealFieldKeys}
        />

        <FieldPickerList
          label="Select custom fields to update"
          options={customFieldOptions}
          selectedKeys={customFieldIds}
          onChange={setCustomFieldIds}
        />

        <NextStepFields value={nextStep} onChange={setNextStep} availableSteps={availableSteps} />
        <TriggerAutomationFields targetIds={targetIds} onChange={setTargetIds} otherTemplates={otherTemplates} />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Create'}
        </button>
      </form>
    </Modal>
  )
}
