'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { DealField } from '@/lib/automations/deal-fields'

import { StepCard } from './step-card'
import type { AutomationStep, CustomFieldOption, LookupOption, StepTrigger } from './types'

export function StepList({
  templateId,
  steps,
  triggers,
  employeeRoles,
  profiles,
  customFieldDefinitions,
  otherTemplates,
  dealFields,
  openStepId,
  onOpenStep,
}: {
  templateId: string
  steps: AutomationStep[]
  triggers: StepTrigger[]
  employeeRoles: LookupOption[]
  profiles: LookupOption[]
  customFieldDefinitions: CustomFieldOption[]
  otherTemplates: LookupOption[]
  dealFields: DealField[]
  openStepId: string | null
  onOpenStep: (stepId: string | null) => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const ordered = [...steps].sort((a, b) => a.step_number - b.step_number)

  async function handleAddStep() {
    setBusy(true)
    setError(null)
    const response = await fetch(`/api/automations/${templateId}/steps`, { method: 'POST' })
    const result = await response.json()
    setBusy(false)
    if (!response.ok) {
      setError(result.error ?? 'Could not add step.')
      return
    }
    onOpenStep(result.id)
    router.refresh()
  }

  async function handleMove(stepId: string, direction: -1 | 1) {
    const index = ordered.findIndex((step) => step.id === stepId)
    const swapWith = index + direction
    if (swapWith < 0 || swapWith >= ordered.length) return

    const reorderedIds = ordered.map((step) => step.id)
    ;[reorderedIds[index], reorderedIds[swapWith]] = [reorderedIds[swapWith], reorderedIds[index]]

    setBusy(true)
    setError(null)
    const response = await fetch(`/api/automations/${templateId}/steps/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_ids: reorderedIds }),
    })
    setBusy(false)
    if (!response.ok) {
      const result = await response.json()
      setError(result.error ?? 'Could not reorder steps.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
      <h2 className="text-sm font-medium text-muted-foreground">Steps</h2>

      {ordered.map((step, index) => (
        <StepCard
          key={step.id}
          templateId={templateId}
          step={step}
          triggers={triggers.filter((trigger) => trigger.step_id === step.id)}
          allSteps={ordered}
          employeeRoles={employeeRoles}
          profiles={profiles}
          customFieldDefinitions={customFieldDefinitions}
          otherTemplates={otherTemplates}
          dealFields={dealFields}
          isOpen={openStepId === step.id}
          onOpen={() => onOpenStep(step.id)}
          onClose={() => onOpenStep(null)}
          canMoveUp={index > 0}
          canMoveDown={index < ordered.length - 1}
          onMoveUp={() => handleMove(step.id, -1)}
          onMoveDown={() => handleMove(step.id, 1)}
        />
      ))}

      {ordered.length === 0 && <p className="text-sm text-muted-foreground">No steps yet.</p>}

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={handleAddStep}
        disabled={busy}
        className="w-fit rounded border border-input-border px-4 py-2 text-sm disabled:opacity-50"
      >
        Add step
      </button>
    </div>
  )
}
