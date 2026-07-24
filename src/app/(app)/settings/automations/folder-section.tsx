'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AutomationRow } from './automation-row'
import { NewAutomationButton } from './new-automation-button'
import { NewFolderButton } from './new-folder-button'
import type { AutomationFolder, AutomationListItem, FolderOption } from './types'

// Renders one folder's header (rename/delete/expand) plus its contents. Used for both
// top-level folders (which also render their subfolders, one level deep) and subfolders
// (rendered by the parent with subfolders=undefined, so nesting stops at 2 levels).
export function FolderSection({
  folder,
  automations,
  subfolders,
  templatesByFolder,
  folderOptions,
  expandedIds,
  onToggle,
}: {
  folder: AutomationFolder
  automations: AutomationListItem[]
  subfolders?: AutomationFolder[]
  templatesByFolder: Record<string, AutomationListItem[]>
  folderOptions: FolderOption[]
  expandedIds: Set<string>
  onToggle: (id: string) => void
}) {
  const router = useRouter()
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState(folder.name)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isExpanded = expandedIds.has(folder.id)
  const isTopLevel = !folder.parent_folder_id

  const totalAutomationCount =
    automations.length + (subfolders ?? []).reduce((sum, sub) => sum + (templatesByFolder[sub.id]?.length ?? 0), 0)

  async function handleRename(event: React.FormEvent) {
    event.preventDefault()
    const name = draftName.trim()
    if (!name) return
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/automation-folders/${folder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Could not rename this folder.')
      return
    }

    setIsRenaming(false)
    router.refresh()
  }

  async function handleDelete() {
    const subfolderCount = subfolders?.length ?? 0
    const parts = [`${totalAutomationCount} automation${totalAutomationCount === 1 ? '' : 's'}`]
    if (subfolderCount > 0) parts.push(`${subfolderCount} subfolder${subfolderCount === 1 ? '' : 's'}`)
    const detail =
      totalAutomationCount > 0 || subfolderCount > 0
        ? ` This folder contains ${parts.join(' and ')}. Automations will move to Uncategorized.`
        : ''

    if (!confirm(`Delete "${folder.name}"?${detail}`)) return

    setError(null)
    setSubmitting(true)
    const response = await fetch(`/api/automation-folders/${folder.id}`, { method: 'DELETE' })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Could not delete this folder.')
      return
    }

    router.refresh()
  }

  return (
    <li className="border-b border-border last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-4 py-2">
        <button
          type="button"
          onClick={() => onToggle(folder.id)}
          className="flex min-w-0 items-center gap-2 text-left"
        >
          <span className="shrink-0 text-xs text-muted-foreground">{isExpanded ? '▾' : '▸'}</span>
          {isRenaming ? (
            <form onSubmit={handleRename} onClick={(event) => event.stopPropagation()} className="flex items-center gap-1">
              <input
                autoFocus
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                className="rounded border border-input-border bg-input-background px-2 py-0.5 text-sm"
              />
              <button type="submit" disabled={submitting} className="text-xs font-medium text-foreground underline">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRenaming(false)
                  setDraftName(folder.name)
                }}
                className="text-xs text-muted-foreground underline"
              >
                Cancel
              </button>
            </form>
          ) : (
            <span className="truncate text-sm font-medium">{folder.name}</span>
          )}
          <span className="shrink-0 text-xs text-muted-foreground">
            {totalAutomationCount} automation{totalAutomationCount === 1 ? '' : 's'}
          </span>
        </button>

        {!isRenaming && (
          <div className="flex shrink-0 items-center gap-3 text-xs">
            <button type="button" onClick={() => setIsRenaming(true)} className="text-muted-foreground underline">
              Rename
            </button>
            <button type="button" onClick={handleDelete} disabled={submitting} className="text-danger underline disabled:opacity-50">
              Delete
            </button>
          </div>
        )}
      </div>

      {error && <p className="px-4 py-1 text-xs text-danger">{error}</p>}

      {isExpanded && (
        <div className="border-t border-border">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2">
            <NewAutomationButton folderId={folder.id} label="+ New Automation" />
            {isTopLevel && <NewFolderButton parentFolderId={folder.id} label="+ New Subfolder" />}
          </div>

          {automations.length > 0 && (
            <ul className="divide-y divide-border">
              {automations.map((template) => (
                <AutomationRow key={template.id} template={template} folderOptions={folderOptions} />
              ))}
            </ul>
          )}

          {isTopLevel && subfolders && subfolders.length > 0 && (
            <ul className="divide-y divide-border border-t border-border pl-4">
              {subfolders.map((subfolder) => (
                <FolderSection
                  key={subfolder.id}
                  folder={subfolder}
                  automations={templatesByFolder[subfolder.id] ?? []}
                  templatesByFolder={templatesByFolder}
                  folderOptions={folderOptions}
                  expandedIds={expandedIds}
                  onToggle={onToggle}
                />
              ))}
            </ul>
          )}

          {automations.length === 0 && (!subfolders || subfolders.length === 0) && (
            <p className="px-4 py-2 text-sm text-muted-foreground">Nothing in this folder yet.</p>
          )}
        </div>
      )}
    </li>
  )
}
