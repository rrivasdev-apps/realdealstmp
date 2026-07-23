'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AutomationStep, BranchOption, ConditionalStatementConfig, LookupOption, StepTrigger } from '../types'
import { AssigneeFields, initialAssigneeValue, Modal, NextStepFields, TriggerAutomationFields } from './shared'

function emptyOption(key: string): BranchOption {
  return { key, label: '', next_step_id: null, completes_automator: true, next_step_due_delay_days: null }
}

export function ConditionalStatementModal({
  templateId,
  step,
  allSteps,
  employeeRoles,
  profiles,
  otherTemplates,
  triggers,
  onClose,
}: {
  templateId: string
  step: AutomationStep
  allSteps: AutomationStep[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  otherTemplates: LookupOption[]
  triggers: StepTrigger[]
  onClose: () => void
}) {
  const router = useRouter()
  const availableSteps = allSteps.filter((other) => other.id !== step.id)
  const existingConfig = (step.config ?? {}) as Partial<ConditionalStatementConfig>
  const existingOptions = existingConfig.options ?? []

  const [question, setQuestion] = useState(step.name ?? '')
  const [assignee, setAssignee] = useState(
    initialAssigneeValue({ assigned_role_id: step.assigned_role_id, assigned_profile_id: step.assigned_profile_id }, employeeRoles)
  )
  const [option1, setOption1] = useState<BranchOption>(existingOptions[0] ?? emptyOption('option_1'))
  const [option2, setOption2] = useState<BranchOption>(existingOptions[1] ?? emptyOption('option_2'))
  const [targets1, setTargets1] = useState(triggers.filter((t) => t.option_key === 'option_1').map((t) => t.target_template_id))
  const [targets2, setTargets2] = useState(triggers.filter((t) => t.option_key === 'option_2').map((t) => t.target_template_id))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: question,
        ...assignee,
        config: { question, options: [option1, option2] },
        triggers: [
          { option_key: 'option_1', target_template_ids: targets1 },
          { option_key: 'option_2', target_template_ids: targets2 },
        ],
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
    <Modal title="Conditional Statement" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />

        <label className="flex flex-col gap-1 text-sm">
          Question
          <textarea
            required
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={2}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <fieldset className="flex flex-col gap-3 rounded border border-border p-3">
          <legend className="px-1 text-sm font-medium">Option 1</legend>
          <label className="flex flex-col gap-1 text-sm">
            Answer
            <input
              type="text"
              required
              value={option1.label}
              onChange={(event) => setOption1({ ...option1, label: event.target.value })}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
          <NextStepFields
            value={option1}
            onChange={(value) => setOption1({ ...option1, ...value })}
            availableSteps={availableSteps}
            label="Choose Option 1 functionality"
          />
          <TriggerAutomationFields
            targetIds={targets1}
            onChange={setTargets1}
            otherTemplates={otherTemplates}
            label="If Option 1 is selected, trigger another automation:"
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded border border-border p-3">
          <legend className="px-1 text-sm font-medium">Option 2</legend>
          <label className="flex flex-col gap-1 text-sm">
            Answer
            <input
              type="text"
              required
              value={option2.label}
              onChange={(event) => setOption2({ ...option2, label: event.target.value })}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
          <NextStepFields
            value={option2}
            onChange={(value) => setOption2({ ...option2, ...value })}
            availableSteps={availableSteps}
            label="Choose Option 2 functionality"
          />
          <TriggerAutomationFields
            targetIds={targets2}
            onChange={setTargets2}
            otherTemplates={otherTemplates}
            label="If Option 2 is selected, trigger another automation:"
          />
        </fieldset>

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
