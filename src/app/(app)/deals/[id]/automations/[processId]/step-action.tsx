'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'
import type { BranchOption, SimpleOption } from '@/lib/automations/step-config'
import type { Database } from '@/lib/supabase/database.types'

type AutomationStepRow = Database['public']['Tables']['automation_steps']['Row']
type AutomationTemplateStepRow = Database['public']['Tables']['automation_template_steps']['Row']
type CustomFieldDefinition = { id: string; name: string; field_type: string; options: string[] | null }

function inputTypeFor(fieldType: string): string {
  if (fieldType === 'date') return 'date'
  if (fieldType === 'number') return 'number'
  return 'text'
}

export function StepAction({
  processId,
  step,
  templateStep,
  dealFields,
  customFieldDefinitions,
  dealValues,
  dealCustomFieldValues,
  nextStepPreview,
}: {
  processId: string
  step: AutomationStepRow
  templateStep: AutomationTemplateStepRow
  dealFields: DealField[]
  customFieldDefinitions: CustomFieldDefinition[]
  dealValues: Record<string, unknown>
  dealCustomFieldValues: Record<string, unknown>
  nextStepPreview: { name: string; type: string } | null
}) {
  const router = useRouter()
  const config = (templateStep.config ?? {}) as Record<string, unknown>
  const dealFieldKeys = Array.isArray(config.deal_fields) ? (config.deal_fields as string[]) : []
  const isSingleChoice = templateStep.step_type === 'option_list' && config.choice_mode === 'single'
  const isMultipleChoice = templateStep.step_type === 'option_list' && config.choice_mode === 'multiple'
  const options = Array.isArray(config.options) ? (config.options as (BranchOption | SimpleOption)[]) : []

  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {}
    for (const key of dealFieldKeys) initial[key] = dealValues[key] ?? ''
    for (const definition of customFieldDefinitions) initial[`custom:${definition.id}`] = dealCustomFieldValues[definition.id] ?? ''
    return initial
  })
  const [selectedOptionKey, setSelectedOptionKey] = useState('')
  const [selectedOptionKeys, setSelectedOptionKeys] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleComplete() {
    setError(null)

    const body: Record<string, unknown> = {}
    if (templateStep.step_type === 'fill_fields') {
      body.field_values = fieldValues
    } else if (templateStep.step_type === 'conditional_statement' || isSingleChoice) {
      if (!selectedOptionKey) {
        setError('Choose an option.')
        return
      }
      body.selected_option_key = selectedOptionKey
    } else if (isMultipleChoice) {
      body.selected_option_keys = selectedOptionKeys
    }

    setSubmitting(true)
    const response = await fetch(`/api/automation-processes/${processId}/steps/${step.id}/complete`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    router.refresh()
  }

  return (
    <div className="mt-4 flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <div>
        <h2 className="text-sm font-medium">{templateStep.name}</h2>
        {templateStep.description && <p className="mt-1 text-sm text-muted-foreground">{templateStep.description}</p>}
        <p className="mt-1 text-xs text-muted-foreground">Due {step.due_at}</p>
      </div>

      {templateStep.step_type === 'fill_fields' && (
        <div className="flex flex-col gap-3">
          {dealFieldKeys.map((key) => {
            const field = dealFields.find((candidate) => candidate.key === key)
            if (!field) return null
            return (
              <label key={key} className="flex flex-col gap-1 text-sm">
                {field.label}
                {field.type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(fieldValues[key])}
                    onChange={(event) => setFieldValues((values) => ({ ...values, [key]: event.target.checked }))}
                  />
                ) : (
                  <input
                    type={inputTypeFor(field.type)}
                    value={(fieldValues[key] as string) ?? ''}
                    onChange={(event) => setFieldValues((values) => ({ ...values, [key]: event.target.value }))}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                )}
              </label>
            )
          })}
          {customFieldDefinitions.map((definition) => {
            const key = `custom:${definition.id}`
            return (
              <label key={key} className="flex flex-col gap-1 text-sm">
                {definition.name}
                {definition.field_type === 'checkbox' ? (
                  <input
                    type="checkbox"
                    checked={Boolean(fieldValues[key])}
                    onChange={(event) => setFieldValues((values) => ({ ...values, [key]: event.target.checked }))}
                  />
                ) : definition.field_type === 'select' ? (
                  <select
                    value={(fieldValues[key] as string) ?? ''}
                    onChange={(event) => setFieldValues((values) => ({ ...values, [key]: event.target.value }))}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  >
                    <option value="">—</option>
                    {(definition.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={inputTypeFor(definition.field_type)}
                    value={(fieldValues[key] as string) ?? ''}
                    onChange={(event) => setFieldValues((values) => ({ ...values, [key]: event.target.value }))}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                )}
              </label>
            )
          })}
        </div>
      )}

      {templateStep.step_type === 'conditional_statement' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{(config.question as string) ?? ''}</p>
          {options.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="option"
                checked={selectedOptionKey === option.key}
                onChange={() => setSelectedOptionKey(option.key)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {isSingleChoice && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{templateStep.name}</p>
          {options.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="option"
                checked={selectedOptionKey === option.key}
                onChange={() => setSelectedOptionKey(option.key)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {isMultipleChoice && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">{templateStep.name}</p>
          {options.map((option) => (
            <label key={option.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedOptionKeys.includes(option.key)}
                onChange={() =>
                  setSelectedOptionKeys((keys) => (keys.includes(option.key) ? keys.filter((key) => key !== option.key) : [...keys, option.key]))
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {nextStepPreview && <p className="text-xs text-muted-foreground">Next step: {nextStepPreview.name} — {nextStepPreview.type}</p>}
      {!nextStepPreview && templateStep.completes_automator && (
        <p className="text-xs text-muted-foreground">Completing this step finishes the automation.</p>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleComplete}
          disabled={submitting}
          className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'This has been completed'}
        </button>
        <button type="button" onClick={() => router.back()} className="rounded border border-input-border px-4 py-2 text-sm">
          This hasn&apos;t been completed
        </button>
      </div>
    </div>
  )
}
