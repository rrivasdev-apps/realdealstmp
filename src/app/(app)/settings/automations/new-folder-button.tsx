'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Inline "type a name, hit Add" control for creating a folder. parentFolderId is null
// for a top-level folder, or a top-level folder's id for a subfolder underneath it.
export function NewFolderButton({ parentFolderId, label }: { parentFolderId: string | null; label: string }) {
  const t = useTranslations('Automations')
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/automation-folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed, parent_folder_id: parentFolderId }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('createFolderError'))
      return
    }

    setName('')
    setCreating(false)
    router.refresh()
  }

  if (!creating) {
    return (
      <button type="button" onClick={() => setCreating(true)} className="rounded border border-border px-3 py-1.5 text-sm">
        {label}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder={t('folderNamePlaceholder')}
        className="field-input px-2 py-1 text-sm"
      />
      <button type="submit" disabled={submitting} className="text-xs font-medium text-foreground underline">
        {t('add')}
      </button>
      <button type="button" onClick={() => setCreating(false)} className="text-xs text-muted-foreground underline">
        {t('cancel')}
      </button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </form>
  )
}
