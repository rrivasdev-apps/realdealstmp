'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'

import { buildFolderOptions, type AutomationFolder } from '../types'
import type { AutomationTemplate, CustomFieldOption, LookupOption, OtherStepOption } from './types'

const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'deal_created', label: 'Any deal is created' },
  { value: 'field_changed', label: 'A field value changes' },
  { value: 'custom_field_changed', label: 'A custom field value changes' },
  { value: 'step_completed', label: 'A step of another automation finishes' },
  { value: 'date_based', label: 'A date field is reached' },
]

export function GeneralSettingsPanel({
  template,
  dealTypes,
  customFieldDefinitions,
  otherTemplates,
  otherSteps,
  dealFields,
  dealDateFields,
  folders,
}: {
  template: AutomationTemplate
  dealTypes: LookupOption[]
  customFieldDefinitions: CustomFieldOption[]
  otherTemplates: LookupOption[]
  otherSteps: OtherStepOption[]
  dealFields: DealField[]
  dealDateFields: DealField[]
  folders: AutomationFolder[]
}) {
  const router = useRouter()
  const [name, setName] = useState(template.name)
  const [folderId, setFolderId] = useState(template.folder_id ?? '')
  const [triggerType, setTriggerType] = useState(template.trigger_type)
  const [triggerDealTypeId, setTriggerDealTypeId] = useState(template.trigger_deal_type_id ?? '')
  const [triggerDealField, setTriggerDealField] = useState(template.trigger_deal_field ?? '')
  const [triggerCustomFieldId, setTriggerCustomFieldId] = useState(template.trigger_custom_field_id ?? '')
  const [triggerSourceTemplateId, setTriggerSourceTemplateId] = useState(
    otherSteps.find((step) => step.id === template.trigger_source_step_id)?.template_id ?? ''
  )
  const [triggerSourceStepId, setTriggerSourceStepId] = useState(template.trigger_source_step_id ?? '')
  const [triggerDateField, setTriggerDateField] = useState(template.trigger_date_field ?? '')
  const [triggerDateDirection, setTriggerDateDirection] = useState(template.trigger_date_direction ?? 'on')
  const [triggerDateOffsetDays, setTriggerDateOffsetDays] = useState(String(template.trigger_date_offset_days ?? 0))
  const [startDelayDays, setStartDelayDays] = useState(String(template.start_delay_days))
  const [firstStepDueDelayDays, setFirstStepDueDelayDays] = useState(String(template.first_step_due_delay_days))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/automations/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        folder_id: folderId || null,
        trigger_type: triggerType,
        trigger_deal_type_id: triggerType === 'deal_created' ? triggerDealTypeId || null : null,
        trigger_deal_field: triggerType === 'field_changed' ? triggerDealField : null,
        trigger_custom_field_id: triggerType === 'custom_field_changed' ? triggerCustomFieldId : null,
        trigger_source_step_id: triggerType === 'step_completed' ? triggerSourceStepId : null,
        trigger_date_field: triggerType === 'date_based' ? triggerDateField : null,
        trigger_date_direction: triggerType === 'date_based' ? triggerDateDirection : null,
        trigger_date_offset_days: triggerType === 'date_based' ? Number(triggerDateOffsetDays) : null,
        start_delay_days: Number(startDelayDays),
        first_step_due_delay_days: Number(firstStepDueDelayDays),
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.refresh()
  }

  async function handleDuplicate() {
    setSubmitting(true)
    const response = await fetch(`/api/automations/${template.id}/duplicate`, { method: 'POST' })
    const result = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setError(result.error ?? 'Could not duplicate this automation.')
      return
    }
    router.push(`/settings/automations/${result.id}`)
  }

  async function handleDelete() {
    if (!confirm(`Delete "${template.name}"? This can't be undone.`)) return
    setSubmitting(true)
    const response = await fetch(`/api/automations/${template.id}`, { method: 'DELETE' })
    const result = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setError(result.error ?? 'Could not delete this automation.')
      return
    }
    router.push('/settings/automations')
  }

  const stepsForSourceTemplate = otherSteps.filter((step) => step.template_id === triggerSourceTemplateId)

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-muted-foreground">Automation general settings</h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            template.is_functional ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          {template.is_functional ? 'Automation Functional' : 'Automation Not Functional'}
        </span>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Folder
        <select
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          {buildFolderOptions(folders).map((option) => (
            <option key={option.id ?? 'uncategorized'} value={option.id ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Choose when this automation starts
        <select
          value={triggerType}
          onChange={(event) => setTriggerType(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          {TRIGGER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {triggerType === 'deal_created' && (
        <label className="flex flex-col gap-1 text-sm">
          Deal type (leave blank for any type)
          <select
            value={triggerDealTypeId}
            onChange={(event) => setTriggerDealTypeId(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">Any type</option>
            {dealTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {triggerType === 'field_changed' && (
        <label className="flex flex-col gap-1 text-sm">
          Deal field
          <select
            value={triggerDealField}
            onChange={(event) => setTriggerDealField(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">Select a field…</option>
            {dealFields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {triggerType === 'custom_field_changed' && (
        <label className="flex flex-col gap-1 text-sm">
          Custom field
          <select
            value={triggerCustomFieldId}
            onChange={(event) => setTriggerCustomFieldId(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">Select a custom field…</option>
            {customFieldDefinitions.map((field) => (
              <option key={field.id} value={field.id}>
                {field.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {triggerType === 'step_completed' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Automation
            <select
              value={triggerSourceTemplateId}
              onChange={(event) => {
                setTriggerSourceTemplateId(event.target.value)
                setTriggerSourceStepId('')
              }}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">Select an automation…</option>
              {otherTemplates.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Step
            <select
              value={triggerSourceStepId}
              onChange={(event) => setTriggerSourceStepId(event.target.value)}
              disabled={!triggerSourceTemplateId}
              className="rounded border border-input-border bg-input-background px-3 py-2 disabled:opacity-50"
            >
              <option value="">Select a step…</option>
              {stepsForSourceTemplate.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name ?? 'Untitled step'}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {triggerType === 'date_based' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            Date field
            <select
              value={triggerDateField}
              onChange={(event) => setTriggerDateField(event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">Select a date field…</option>
              {dealDateFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            When
            <select
              value={triggerDateDirection}
              onChange={(event) => setTriggerDateDirection(event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="on">On the date</option>
              <option value="before">Days before</option>
              <option value="after">Days after</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Days {triggerDateDirection === 'on' ? '(n/a)' : ''}
            <input
              type="number"
              min={0}
              value={triggerDateOffsetDays}
              disabled={triggerDateDirection === 'on'}
              onChange={(event) => setTriggerDateOffsetDays(event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2 disabled:opacity-50"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="flex min-h-[2.5rem] items-start">Days after triggered until the automation starts and is visible to users</span>
          <input
            type="number"
            min={0}
            value={startDelayDays}
            onChange={(event) => setStartDelayDays(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="flex min-h-[2.5rem] items-start">Days after starting until the first step is due</span>
          <input
            type="number"
            min={0}
            value={firstStepDueDelayDays}
            onChange={(event) => setFirstStepDueDelayDays(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>Triggered</span>
        <span className="h-px flex-1 bg-border" />
        <span>{startDelayDays || 0}d</span>
        <span className="h-px flex-1 bg-border" />
        <span>Starts and visible</span>
        <span className="h-px flex-1 bg-border" />
        <span>{firstStepDueDelayDays || 0}d</span>
        <span className="h-px flex-1 bg-border" />
        <span>First step due</span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          Save automation
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={submitting}
          className="rounded border border-input-border px-4 py-2 text-sm disabled:opacity-50"
        >
          Duplicate
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="rounded border border-danger px-4 py-2 text-sm text-danger disabled:opacity-50"
        >
          Delete
        </button>
        <Link href="/settings/automations" className="ml-auto text-sm underline">
          Done
        </Link>
      </div>
    </form>
  )
}
