'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { DRAFT_AUDIENCES, MAX_PURPOSE_LENGTH, type DraftAudience } from '@/lib/ai/draft-config'
import { getStepTypeLabels, type AutomationsTranslator } from '@/lib/automations/labels'

import type { AiDraftStepConfig, AutomationStep, LookupOption, StepTrigger } from '../types'
import { AssigneeFields, initialAssigneeValue, initialNextStepValue, Modal, NextStepFields, TriggerAutomationFields } from './shared'

function getKind(t: AutomationsTranslator, stepType: string | null) {
  const stepTypeLabels = getStepTypeLabels(t)
  const blurbs: Record<string, string> = {
    email_task: t('emailTaskBlurb'),
    call_task: t('callTaskBlurb'),
    generic_task: t('genericTaskBlurb'),
    show_text: t('showTextBlurb'),
  }
  const key = stepType && blurbs[stepType] ? stepType : 'generic_task'
  return { title: stepTypeLabels[key], blurb: blurbs[key] }
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
  const t = useTranslations('Automations')
  const router = useRouter()
  const kind = getKind(t, step.step_type)
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

  // Drafting is offered on the two step types that produce an outbound message.
  const supportsDraft = step.step_type === 'email_task' || step.step_type === 'call_task'
  const savedDraft = (step.config as AiDraftStepConfig | null)?.ai_draft
  const [draftEnabled, setDraftEnabled] = useState(savedDraft?.enabled === true)
  const [draftAudience, setDraftAudience] = useState<DraftAudience>(
    (DRAFT_AUDIENCES as readonly string[]).includes(savedDraft?.audience ?? '')
      ? (savedDraft?.audience as DraftAudience)
      : 'seller'
  )
  const [draftPurpose, setDraftPurpose] = useState(savedDraft?.purpose ?? '')

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError(t('titleRequiredError'))
      return
    }
    if (!assignee.assigned_role_id && !assignee.assigned_profile_id) {
      setError(t('assigneeRequiredError'))
      return
    }
    // Pre-empts the route's English "Describe what the draft should ask for."
    // with a translated check, per CLAUDE.md's rule on server error strings.
    if (supportsDraft && draftEnabled && !draftPurpose.trim()) {
      setError(t('aiDraftPurposeRequiredError'))
      return
    }
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
        config:
          supportsDraft && draftEnabled
            ? { ai_draft: { enabled: true, audience: draftAudience, purpose: draftPurpose.trim() } }
            : {},
        triggers: [{ option_key: null, target_template_ids: targetIds }],
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    router.refresh()
    onClose()
  }

  return (
    <Modal title={kind.title} onClose={onClose}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{kind.blurb}</p>

        <label className="field-label">
          {t('taskTitleLabel')}
          <input
            type="text"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="field-label">
          {t('taskDescriptionLabel')}
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        {supportsDraft && (
          <fieldset className="rounded border border-border p-3">
            <legend className="px-1 text-sm font-medium">{t('aiDraftLegend')}</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draftEnabled}
                onChange={(event) => setDraftEnabled(event.target.checked)}
              />
              {t('aiDraftEnabledLabel')}
            </label>
            <p className="mt-1 text-xs text-muted-foreground">{t('aiDraftBlurb')}</p>

            {draftEnabled && (
              <div className="mt-3 flex flex-col gap-3">
                <label className="field-label">
                  {t('aiDraftAudienceLabel')}
                  <select
                    value={draftAudience}
                    onChange={(event) => setDraftAudience(event.target.value as DraftAudience)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  >
                    {DRAFT_AUDIENCES.map((audience) => (
                      <option key={audience} value={audience}>
                        {t(`aiDraftAudience_${audience}` as Parameters<typeof t>[0])}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field-label">
                  {t('aiDraftPurposeLabel')}
                  <input
                    type="text"
                    value={draftPurpose}
                    maxLength={MAX_PURPOSE_LENGTH}
                    onChange={(event) => setDraftPurpose(event.target.value)}
                    placeholder={t('aiDraftPurposePlaceholder')}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              </div>
            )}
          </fieldset>
        )}

        <AssigneeFields value={assignee} onChange={setAssignee} employeeRoles={employeeRoles} profiles={profiles} />
        <NextStepFields value={nextStep} onChange={setNextStep} availableSteps={availableSteps} />
        <TriggerAutomationFields targetIds={targetIds} onChange={setTargetIds} otherTemplates={otherTemplates} />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? t('saving') : t('create')}
        </button>
      </form>
    </Modal>
  )
}
