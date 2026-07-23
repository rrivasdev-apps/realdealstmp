'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AutomationStep, BranchOption, LookupOption, OptionListConfig, StepTrigger } from '../types'
import { AssigneeFields, initialAssigneeValue, initialNextStepValue, Modal, NextStepFields, TriggerAutomationFields } from './shared'

const MAX_OPTIONS = 10

function emptyOption(key: string): BranchOption {
  return { key, label: '', next_step_id: null, completes_automator: true, next_step_due_delay_days: null }
}

function nextOptionKey(existing: { key: string }[]): string {
  let n = 1
  while (existing.some((option) => option.key === `option_${n}`)) n += 1
  return `option_${n}`
}

function OptionRow({
  option,
  index,
  choiceMode,
  availableSteps,
  targetIds,
  onChangeOption,
  onChangeTargets,
  onRemove,
  otherTemplates,
}: {
  option: BranchOption
  index: number
  choiceMode: 'single' | 'multiple'
  availableSteps: AutomationStep[]
  targetIds: string[]
  onChangeOption: (option: BranchOption) => void
  onChangeTargets: (targetIds: string[]) => void
  onRemove: () => void
  otherTemplates: LookupOption[]
}) {
  return (
    <fieldset className="flex flex-col gap-3 rounded border border-border p-3">
      <div className="flex items-center justify-between">
        <legend className="px-1 text-sm font-medium">Option {index + 1}</legend>
        <button type="button" onClick={onRemove} className="text-xs text-danger hover:underline">
          Remove
        </button>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Option name
        <input
          type="text"
          required
          value={option.label}
          onChange={(event) => onChangeOption({ ...option, label: event.target.value })}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      {choiceMode === 'single' && (
        <NextStepFields value={option} onChange={(value) => onChangeOption({ ...option, ...value })} availableSteps={availableSteps} />
      )}

      <TriggerAutomationFields
        targetIds={targetIds}
        onChange={onChangeTargets}
        otherTemplates={otherTemplates}
        label={`If this option is selected, trigger another automation:`}
      />
    </fieldset>
  )
}

export function OptionListModal({
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
  const existingConfig = (step.config ?? {}) as Partial<OptionListConfig>

  const [choiceMode, setChoiceMode] = useState<'single' | 'multiple'>(existingConfig.choice_mode ?? 'single')
  const [name, setName] = useState(step.name ?? '')
  const [assignee, setAssignee] = useState(
    initialAssigneeValue({ assigned_role_id: step.assigned_role_id, assigned_profile_id: step.assigned_profile_id }, employeeRoles)
  )
  const [options, setOptions] = useState<BranchOption[]>(
    (existingConfig.options as BranchOption[] | undefined)?.map((option) => ({
      key: option.key,
      label: option.label,
      next_step_id: (option as BranchOption).next_step_id ?? null,
      completes_automator: (option as BranchOption).completes_automator ?? true,
      next_step_due_delay_days: (option as BranchOption).next_step_due_delay_days ?? null,
    })) ?? [emptyOption('option_1')]
  )
  const [optionTargets, setOptionTargets] = useState<Record<string, string[]>>(
    Object.fromEntries(
      options.map((option) => [option.key, triggers.filter((t) => t.option_key === option.key).map((t) => t.target_template_id)])
    )
  )
  const [stepNextStep, setStepNextStep] = useState(
    initialNextStepValue({
      next_step_id: step.next_step_id,
      completes_automator: step.completes_automator,
      next_step_due_delay_days: step.next_step_due_delay_days,
    })
  )
  const [stepTargetIds, setStepTargetIds] = useState(triggers.filter((t) => t.option_key === null).map((t) => t.target_template_id))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateOption(key: string, next: BranchOption) {
    setOptions((prev) => prev.map((option) => (option.key === key ? next : option)))
  }

  function addOption() {
    if (options.length >= MAX_OPTIONS) return
    const key = nextOptionKey(options)
    setOptions((prev) => [...prev, emptyOption(key)])
    setOptionTargets((prev) => ({ ...prev, [key]: [] }))
  }

  function removeOption(key: string) {
    setOptions((prev) => prev.filter((option) => option.key !== key))
    setOptionTargets((prev) => {
      const rest = { ...prev }
      delete rest[key]
      return rest
    })
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const triggersPayload: { option_key: string | null; target_template_ids: string[] }[] = options.map((option) => ({
      option_key: option.key,
      target_template_ids: optionTargets[option.key] ?? [],
    }))
    if (choiceMode === 'multiple') {
      triggersPayload.push({ option_key: null, target_template_ids: stepTargetIds })
    }

    const config: OptionListConfig =
      choiceMode === 'single'
        ? { choice_mode: 'single', options }
        : { choice_mode: 'multiple', options: options.map((option) => ({ key: option.key, label: option.label })) }

    const response = await fetch(`/api/automations/${templateId}/steps/${step.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        ...assignee,
        config,
        ...(choiceMode === 'multiple' ? stepNextStep : {}),
        triggers: triggersPayload,
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
    <Modal title="Options Task" onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Lets the user pick from a list of options — one option (single choice) or several (multiple choice).
        </p>

        <div className="flex w-fit overflow-hidden rounded border border-input-border">
          <button
            type="button"
            onClick={() => setChoiceMode('single')}
            className={`px-3 py-1.5 text-sm ${choiceMode === 'single' ? 'bg-foreground text-background' : ''}`}
          >
            Single choice
          </button>
          <button
            type="button"
            onClick={() => setChoiceMode('multiple')}
            className={`px-3 py-1.5 text-sm ${choiceMode === 'multiple' ? 'bg-foreground text-background' : ''}`}
          >
            Multiple choice
          </button>
        </div>

        <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />

        <label className="flex flex-col gap-1 text-sm">
          Option task title/description
          <textarea
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            rows={2}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Options list</span>
            <span className="text-xs text-muted-foreground">There is a limit of {MAX_OPTIONS} options, you have {MAX_OPTIONS - options.length} left</span>
          </div>
          {options.map((option, index) => (
            <OptionRow
              key={option.key}
              option={option}
              index={index}
              choiceMode={choiceMode}
              availableSteps={availableSteps}
              targetIds={optionTargets[option.key] ?? []}
              onChangeOption={(next) => updateOption(option.key, next)}
              onChangeTargets={(ids) => setOptionTargets((prev) => ({ ...prev, [option.key]: ids }))}
              onRemove={() => removeOption(option.key)}
              otherTemplates={otherTemplates}
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            disabled={options.length >= MAX_OPTIONS}
            className="w-fit rounded border border-input-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            Add option
          </button>
        </div>

        {choiceMode === 'multiple' && (
          <>
            <NextStepFields
              value={stepNextStep}
              onChange={setStepNextStep}
              availableSteps={availableSteps}
              label="Choose step completion functionality"
            />
            <TriggerAutomationFields
              targetIds={stepTargetIds}
              onChange={setStepTargetIds}
              otherTemplates={otherTemplates}
              label="If you want step completion to trigger another automation regardless of option, select it below:"
            />
          </>
        )}

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
