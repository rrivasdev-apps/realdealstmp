'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { getTriggerLabels } from '@/lib/automations/labels'

import type { AutomationListItem, FolderOption } from './types'

export function AutomationRow({
  template,
  folderOptions,
  folderLabel,
}: {
  template: AutomationListItem
  folderOptions: FolderOption[]
  // When set, shows which folder this automation lives in -- used in flat search results.
  folderLabel?: string
}) {
  const t = useTranslations('Automations')
  const router = useRouter()
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const triggerLabels = getTriggerLabels(t)

  async function handleMove(event: React.ChangeEvent<HTMLSelectElement>) {
    const folderId = event.target.value || null
    setError(null)
    setMoving(true)

    const response = await fetch(`/api/automations/${template.id}/folder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId }),
    })
    const result = await response.json()
    setMoving(false)

    if (!response.ok) {
      setError(result.error ?? t('moveFolderError'))
      return
    }

    router.refresh()
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div>
        <Link href={`/settings/automations/${template.id}`} className="text-sm font-medium hover:underline">
          {template.name}
        </Link>
        <p className="text-xs text-muted-foreground">
          {triggerLabels[template.trigger_type] ?? template.trigger_type}
          {template.deal_types ? ` — ${template.deal_types.name}` : ''}
          {folderLabel ? ` · ${folderLabel}` : ''}
        </p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            template.is_functional ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
          }`}
        >
          {template.is_functional ? t('functional') : t('notFunctional')}
        </span>
        <select
          aria-label={t('moveToFolderAria', { name: template.name })}
          value={template.folder_id ?? ''}
          onChange={handleMove}
          disabled={moving}
          className="field-input px-2 py-1 text-xs disabled:opacity-50"
        >
          {folderOptions.map((option) => (
            <option key={option.id ?? 'uncategorized'} value={option.id ?? ''}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </li>
  )
}
