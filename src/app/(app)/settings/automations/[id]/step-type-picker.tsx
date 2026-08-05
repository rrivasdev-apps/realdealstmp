'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getStepTypeLabels } from '@/lib/automations/labels'

const STEP_TYPE_ORDER = [
  'fill_fields',
  'conditional_statement',
  'email_task',
  'call_task',
  'generic_task',
  'trigger',
  'option_list',
  'show_text',
]

export function StepTypePicker({
  templateId,
  stepId,
  onPicked,
}: {
  templateId: string
  stepId: string
  onPicked: () => void
}) {
  const t = useTranslations('Automations')
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const stepTypeLabels = getStepTypeLabels(t)

  async function handlePick(stepType: string) {
    setPending(stepType)
    setError(null)
    const response = await fetch(`/api/automations/${templateId}/steps/${stepId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step_type: stepType }),
    })
    const result = await response.json()
    setPending(null)
    if (!response.ok) {
      setError(result.error ?? t('pickTypeError'))
      return
    }
    router.refresh()
    onPicked()
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-dashed border-input-border p-4">
      <p className="text-sm text-muted-foreground">{t('pickerPrompt')}</p>
      <div className="flex flex-wrap gap-2">
        {STEP_TYPE_ORDER.map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending !== null}
            onClick={() => handlePick(value)}
            className="rounded border border-input-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {pending === value ? t('settingEllipsis') : stepTypeLabels[value]}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
