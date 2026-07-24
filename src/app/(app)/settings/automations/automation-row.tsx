'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import type { AutomationListItem, FolderOption } from './types'

const TRIGGER_LABELS: Record<string, string> = {
  deal_created: 'Any deal is created',
  field_changed: 'A field value changes',
  custom_field_changed: 'A custom field value changes',
  step_completed: 'Another automation finishes a step',
  date_based: 'A date field is reached',
}

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
  const router = useRouter()
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      setError(result.error ?? 'Could not move this automation.')
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
          {TRIGGER_LABELS[template.trigger_type] ?? template.trigger_type}
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
          {template.is_functional ? 'Functional' : 'Not functional'}
        </span>
        <select
          aria-label={`Move ${template.name} to folder`}
          value={template.folder_id ?? ''}
          onChange={handleMove}
          disabled={moving}
          className="rounded border border-input-border bg-input-background px-2 py-1 text-xs disabled:opacity-50"
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
