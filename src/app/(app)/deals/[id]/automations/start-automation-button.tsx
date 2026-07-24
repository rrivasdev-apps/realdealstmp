'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function StartAutomationButton({
  dealId,
  availableTemplates,
}: {
  dealId: string
  availableTemplates: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [templateId, setTemplateId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleStart() {
    if (!templateId) return
    setSubmitting(true)
    setError(null)
    const response = await fetch(`/api/deals/${dealId}/automations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ template_id: templateId }),
    })
    const result = await response.json()
    setSubmitting(false)
    if (!response.ok) {
      setError(result.error ?? 'Could not start this automation.')
      return
    }
    setTemplateId('')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={templateId}
          onChange={(event) => setTemplateId(event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2 text-sm"
        >
          <option value="">Choose an automation to start…</option>
          {availableTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleStart}
          disabled={submitting || !templateId}
          className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Starting…' : 'Start an automator manually for this deal'}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
