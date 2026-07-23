'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STEP_TYPE_LABELS: { value: string; label: string }[] = [
  { value: 'fill_fields', label: 'Fill Fields' },
  { value: 'conditional_statement', label: 'Conditional Statement' },
  { value: 'email_task', label: 'Email Task' },
  { value: 'call_task', label: 'Call Task' },
  { value: 'generic_task', label: 'Generic Task' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'option_list', label: 'Option List' },
  { value: 'show_text', label: 'Show Text' },
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
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null)

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
      setError(result.error ?? 'Could not set this step’s type.')
      return
    }
    router.refresh()
    onPicked()
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-dashed border-input-border p-4">
      <p className="text-sm text-muted-foreground">Drop an action on this step</p>
      <div className="flex flex-wrap gap-2">
        {STEP_TYPE_LABELS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending !== null}
            onClick={() => handlePick(option.value)}
            className="rounded border border-input-border px-3 py-1.5 text-sm disabled:opacity-50"
          >
            {pending === option.value ? 'Setting…' : option.label}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
