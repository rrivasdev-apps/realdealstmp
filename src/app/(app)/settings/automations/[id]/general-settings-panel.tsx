'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'
import { getTriggerLabels } from '@/lib/automations/labels'

import { buildFolderOptions, type AutomationFolder } from '../types'
import type { AutomationTemplate, CustomFieldOption, LookupOption, OtherStepOption } from './types'

const TRIGGER_ORDER = ['deal_created', 'field_changed', 'custom_field_changed', 'step_completed', 'date_based']

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
  const t = useTranslations('Automations')
  const router = useRouter()
  const triggerLabels = getTriggerLabels(t)
  const triggerOptions = TRIGGER_ORDER.map((value) => ({ value, label: triggerLabels[value] }))
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
    if (!name.trim()) {
      setError(t('nameRequiredError'))
      return
    }
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
      setError(result.error ?? t('genericError'))
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
      setError(result.error ?? t('duplicateError'))
      return
    }
    router.push(`/settings/automations/${result.id}`)
  }

  async function handleDelete() {
    if (!confirm(t('deleteTemplateConfirm', { name: template.name }))) return
    setSubmitting(true)
    const response = await fetch(`/api/automations/${template.id}`, { method: 'DELETE' })
    const result = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setError(result.error ?? t('deleteTemplateError'))
      return
    }
    router.push('/settings/automations')
  }

  const stepsForSourceTemplate = otherSteps.filter((step) => step.template_id === triggerSourceTemplateId)

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="heading-subsection">{t('generalSettingsTitle')}</h2>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            template.is_functional ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          {template.is_functional ? t('functionalBadge') : t('notFunctionalBadge')}
        </span>
      </div>

      <label className="field-label">
        {t('nameLabel')}
        <input
          type="text"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field-input px-3 py-2"
        />
      </label>

      <label className="field-label">
        {t('folderLabel')}
        <select
          value={folderId}
          onChange={(event) => setFolderId(event.target.value)}
          className="field-input px-3 py-2"
        >
          {buildFolderOptions(folders, t('uncategorized')).map((option) => (
            <option key={option.id ?? 'uncategorized'} value={option.id ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        {t('chooseTriggerLabel')}
        <select
          value={triggerType}
          onChange={(event) => setTriggerType(event.target.value)}
          className="field-input px-3 py-2"
        >
          {triggerOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {triggerType === 'deal_created' && (
        <label className="field-label">
          {t('dealTypeLabel')}
          <select
            value={triggerDealTypeId}
            onChange={(event) => setTriggerDealTypeId(event.target.value)}
            className="field-input px-3 py-2"
          >
            <option value="">{t('anyType')}</option>
            {dealTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {triggerType === 'field_changed' && (
        <label className="field-label">
          {t('dealFieldLabel')}
          <select
            value={triggerDealField}
            onChange={(event) => setTriggerDealField(event.target.value)}
            className="field-input px-3 py-2"
          >
            <option value="">{t('selectFieldPlaceholder')}</option>
            {dealFields.map((field) => (
              <option key={field.key} value={field.key}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {triggerType === 'custom_field_changed' && (
        <label className="field-label">
          {t('customFieldLabel')}
          <select
            value={triggerCustomFieldId}
            onChange={(event) => setTriggerCustomFieldId(event.target.value)}
            className="field-input px-3 py-2"
          >
            <option value="">{t('selectCustomFieldPlaceholder')}</option>
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
          <label className="field-label">
            {t('automationFallback')}
            <select
              value={triggerSourceTemplateId}
              onChange={(event) => {
                setTriggerSourceTemplateId(event.target.value)
                setTriggerSourceStepId('')
              }}
              className="field-input px-3 py-2"
            >
              <option value="">{t('selectAutomationPlaceholder')}</option>
              {otherTemplates.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            {t('stepLabel')}
            <select
              value={triggerSourceStepId}
              onChange={(event) => setTriggerSourceStepId(event.target.value)}
              disabled={!triggerSourceTemplateId}
              className="field-input px-3 py-2 disabled:opacity-50"
            >
              <option value="">{t('selectStepPlaceholder')}</option>
              {stepsForSourceTemplate.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name ?? t('untitledStep')}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {triggerType === 'date_based' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="field-label">
            {t('dateFieldLabel')}
            <select
              value={triggerDateField}
              onChange={(event) => setTriggerDateField(event.target.value)}
              className="field-input px-3 py-2"
            >
              <option value="">{t('selectDateFieldPlaceholder')}</option>
              {dealDateFields.map((field) => (
                <option key={field.key} value={field.key}>
                  {field.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label">
            {t('whenLabel')}
            <select
              value={triggerDateDirection}
              onChange={(event) => setTriggerDateDirection(event.target.value)}
              className="field-input px-3 py-2"
            >
              <option value="on">{t('onTheDate')}</option>
              <option value="before">{t('daysBefore')}</option>
              <option value="after">{t('daysAfter')}</option>
            </select>
          </label>

          <label className="field-label">
            {t('daysLabel')} {triggerDateDirection === 'on' ? t('naSuffix') : ''}
            <input
              type="number"
              min={0}
              value={triggerDateOffsetDays}
              disabled={triggerDateDirection === 'on'}
              onChange={(event) => setTriggerDateOffsetDays(event.target.value)}
              className="field-input px-3 py-2 disabled:opacity-50"
            />
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="field-label">
          <span className="flex min-h-[2.5rem] items-start">{t('startDelayLabel')}</span>
          <input
            type="number"
            min={0}
            value={startDelayDays}
            onChange={(event) => setStartDelayDays(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>

        <label className="field-label">
          <span className="flex min-h-[2.5rem] items-start">{t('firstStepDelayLabel')}</span>
          <input
            type="number"
            min={0}
            value={firstStepDueDelayDays}
            onChange={(event) => setFirstStepDueDelayDays(event.target.value)}
            className="field-input px-3 py-2"
          />
        </label>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{t('triggeredLabel')}</span>
        <span className="h-px flex-1 bg-border" />
        <span>{startDelayDays || 0}d</span>
        <span className="h-px flex-1 bg-border" />
        <span>{t('startsVisibleLabel')}</span>
        <span className="h-px flex-1 bg-border" />
        <span>{firstStepDueDelayDays || 0}d</span>
        <span className="h-px flex-1 bg-border" />
        <span>{t('firstStepDueLabel')}</span>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary"
        >
          {t('saveAutomation')}
        </button>
        <button
          type="button"
          onClick={handleDuplicate}
          disabled={submitting}
          className="rounded border border-input-border px-4 py-2 text-sm disabled:opacity-50"
        >
          {t('duplicate')}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={submitting}
          className="rounded border border-danger px-4 py-2 text-sm text-danger disabled:opacity-50"
        >
          {t('delete')}
        </button>
        <Link href="/settings/automations" className="ml-auto text-sm underline">
          {t('done')}
        </Link>
      </div>
    </form>
  )
}
