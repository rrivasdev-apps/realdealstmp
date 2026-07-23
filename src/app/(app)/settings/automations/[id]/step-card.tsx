'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'

import { ConditionalStatementModal } from './step-config-modals/conditional-statement-modal'
import { FillFieldsModal } from './step-config-modals/fill-fields-modal'
import { OptionListModal } from './step-config-modals/option-list-modal'
import {
  AssigneeFields,
  initialAssigneeValue,
  initialNextStepValue,
  NextStepFields,
  TriggerAutomationFields,
} from './step-config-modals/shared'
import { SimpleTaskModal } from './step-config-modals/simple-task-modal'
import { StepTypePicker } from './step-type-picker'
import type { AutomationStep, CustomFieldOption, LookupOption, StepTrigger } from './types'

const STEP_TYPE_LABELS: Record<string, string> = {
  fill_fields: 'Fill Fields',
  conditional_statement: 'Conditional Statement',
  email_task: 'Email Task',
  call_task: 'Call Task',
  generic_task: 'Generic Task',
  show_text: 'Show Text',
  option_list: 'Option List',
  trigger: 'Trigger',
}

function TriggerStepInline({
  templateId,
  step,
  allSteps,
  employeeRoles,
  profiles,
  otherTemplates,
  triggers,
  onSaved,
}: {
  templateId: string
  step: AutomationStep
  allSteps: AutomationStep[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  otherTemplates: LookupOption[]
  triggers: StepTrigger[]
  onSaved: () => void
}) {
  const router = useRouter()
  const availableSteps = allSteps.filter((other) => other.id !== step.id)

  const [name, setName] = useState(step.name ?? '')
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

  async function handleSave() {
    setError(null)
    setSubmitting(true)
    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        ...assignee,
        ...nextStep,
        config: {},
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
    onSaved()
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-3">
      <label className="flex flex-col gap-1 text-sm">
        Step name
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>
      <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />
      <NextStepFields value={nextStep} onChange={setNextStep} availableSteps={availableSteps} />
      <TriggerAutomationFields targetIds={targetIds} onChange={setTargetIds} otherTemplates={otherTemplates} />
      {error && <p className="text-sm text-danger">{error}</p>}
      <button
        type="button"
        onClick={handleSave}
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : 'Save'}
      </button>
    </div>
  )
}

export function StepCard({
  templateId,
  step,
  triggers,
  allSteps,
  employeeRoles,
  profiles,
  customFieldDefinitions,
  otherTemplates,
  dealFields,
  isOpen,
  onOpen,
  onClose,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: {
  templateId: string
  step: AutomationStep
  triggers: StepTrigger[]
  allSteps: AutomationStep[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  customFieldDefinitions: CustomFieldOption[]
  otherTemplates: LookupOption[]
  dealFields: DealField[]
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const router = useRouter()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const typeLabel = step.step_type ? STEP_TYPE_LABELS[step.step_type] : null

  async function handleDelete() {
    if (!confirm(`Delete Step ${step.step_number}? This can't be undone.`)) return
    setDeleting(true)
    setDeleteError(null)
    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, { method: 'DELETE' })
    const result = await response.json()
    setDeleting(false)
    if (!response.ok) {
      setDeleteError(result.error ?? 'Could not delete this step.')
      return
    }
    onClose()
    router.refresh()
  }

  return (
    <div className="rounded border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onOpen} className="flex-1 text-left text-sm font-medium">
          Step {step.step_number}
          {step.name ? ` — ${step.name}` : ''}
          {typeLabel && <span className="ml-2 text-xs font-normal text-muted-foreground">{typeLabel}</span>}
        </button>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            step.is_operational ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          {step.is_operational ? 'Step Operational' : 'Step Not Operational'}
        </span>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            aria-label="Move step up"
            className="rounded border border-input-border px-2 py-1 text-xs disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            aria-label="Move step down"
            className="rounded border border-input-border px-2 py-1 text-xs disabled:opacity-30"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete step"
            className="rounded border border-danger px-2 py-1 text-xs text-danger disabled:opacity-50"
          >
            {deleting ? '…' : '✕'}
          </button>
        </div>
      </div>
      {deleteError && <p className="mt-1 text-sm text-danger">{deleteError}</p>}

      {isOpen && !step.step_type && (
        <div className="mt-3">
          <StepTypePicker templateId={templateId} stepId={step.id} onPicked={onOpen} />
        </div>
      )}

      {isOpen && step.step_type === 'trigger' && (
        <div className="mt-3">
          <TriggerStepInline
            templateId={templateId}
            step={step}
            allSteps={allSteps}
            employeeRoles={employeeRoles}
            profiles={profiles}
            otherTemplates={otherTemplates}
            triggers={triggers}
            onSaved={onClose}
          />
        </div>
      )}

      {isOpen && step.step_type === 'fill_fields' && (
        <FillFieldsModal
          templateId={templateId}
          step={step}
          allSteps={allSteps}
          employeeRoles={employeeRoles}
          profiles={profiles}
          customFieldDefinitions={customFieldDefinitions}
          otherTemplates={otherTemplates}
          dealFields={dealFields}
          triggers={triggers}
          onClose={onClose}
        />
      )}

      {isOpen && step.step_type === 'conditional_statement' && (
        <ConditionalStatementModal
          templateId={templateId}
          step={step}
          allSteps={allSteps}
          employeeRoles={employeeRoles}
          profiles={profiles}
          otherTemplates={otherTemplates}
          triggers={triggers}
          onClose={onClose}
        />
      )}

      {isOpen && step.step_type === 'option_list' && (
        <OptionListModal
          templateId={templateId}
          step={step}
          allSteps={allSteps}
          employeeRoles={employeeRoles}
          profiles={profiles}
          otherTemplates={otherTemplates}
          triggers={triggers}
          onClose={onClose}
        />
      )}

      {isOpen && (step.step_type === 'email_task' || step.step_type === 'call_task' || step.step_type === 'generic_task' || step.step_type === 'show_text') && (
        <SimpleTaskModal
          templateId={templateId}
          step={step}
          allSteps={allSteps}
          employeeRoles={employeeRoles}
          profiles={profiles}
          otherTemplates={otherTemplates}
          triggers={triggers}
          onClose={onClose}
        />
      )}
    </div>
  )
}
