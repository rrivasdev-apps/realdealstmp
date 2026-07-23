'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AutomationStep, LookupOption, StepTrigger } from '../types'
import { AssigneeFields, initialAssigneeValue, initialNextStepValue, Modal, NextStepFields, TriggerAutomationFields } from './shared'

const KIND_LABELS: Record<string, { title: string; blurb: string }> = {
  email_task: { title: 'Email Task', blurb: 'This action creates a task due to an assignee at a specific time. It shows up as an Email task.' },
  call_task: { title: 'Call Task', blurb: 'This action creates a task due to an assignee at a specific time. It shows up as a Call task.' },
  generic_task: { title: 'Generic Task', blurb: 'This action creates a task due to an assignee at a specific time.' },
  show_text: { title: 'Show Text', blurb: 'This action shows a reminder to the assignee — no email or call semantics, just a to-do.' },
}

export function SimpleTaskModal({
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
  const kind = KIND_LABELS[step.step_type ?? ''] ?? KIND_LABELS.generic_task
  const availableSteps = allSteps.filter((other) => other.id !== step.id)

  const [name, setName] = useState(step.name ?? '')
  const [description, setDescription] = useState(step.description ?? '')
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

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
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
    onClose()
  }

  return (
    <Modal title={kind.title} onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{kind.blurb}</p>

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

        <label className="flex flex-col gap-1 text-sm">
          Task description
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />
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
