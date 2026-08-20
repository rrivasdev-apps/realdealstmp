'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function StartAutomationButton({
  dealId,
  availableTemplates,
}: {
  dealId: string
  availableTemplates: { id: string; name: string }[]
}) {
  const t = useTranslations('Automations')
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
      setError(result.error ?? t('startAutomationError'))
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
          className="field-input px-3 py-2 text-sm"
        >
          <option value="">{t('chooseAutomationPlaceholder')}</option>
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
          className="btn-primary"
        >
          {submitting ? t('starting') : t('startManually')}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  )
}
