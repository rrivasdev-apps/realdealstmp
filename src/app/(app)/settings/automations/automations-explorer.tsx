'use client'

import { useMemo, useState } from 'react'

import { AutomationRow } from './automation-row'
import { FolderSection } from './folder-section'
import { NewAutomationButton } from './new-automation-button'
import { NewFolderButton } from './new-folder-button'
import { buildFolderOptions, type AutomationFolder, type AutomationListItem } from './types'

export function AutomationsExplorer({ folders, templates }: { folders: AutomationFolder[]; templates: AutomationListItem[] }) {
  const [query, setQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const folderOptions = useMemo(() => buildFolderOptions(folders), [folders])
  const folderNameById = useMemo(() => new Map(folders.map((folder) => [folder.id, folder.name])), [folders])

  const templatesByFolder = useMemo(() => {
    const map: Record<string, AutomationListItem[]> = {}
    for (const template of templates) {
      if (!template.folder_id) continue
      ;(map[template.folder_id] ??= []).push(template)
    }
    return map
  }, [templates])

  const uncategorized = templates.filter((template) => !template.folder_id)
  const topLevelFolders = folders.filter((folder) => !folder.parent_folder_id)

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const trimmedQuery = query.trim().toLowerCase()

  if (trimmedQuery) {
    const matches = templates.filter((template) => template.name.toLowerCase().includes(trimmedQuery))
    return (
      <div>
        <SearchBox query={query} onChange={setQuery} />
        <ul className="mt-2 max-w-2xl divide-y divide-border rounded-lg border border-border bg-background">
          {matches.map((template) => (
            <AutomationRow
              key={template.id}
              template={template}
              folderOptions={folderOptions}
              folderLabel={template.folder_id ? folderNameById.get(template.folder_id) : 'Uncategorized'}
            />
          ))}
          {matches.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No automations match &ldquo;{query}&rdquo;.</li>}
        </ul>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchBox query={query} onChange={setQuery} />
        <NewFolderButton parentFolderId={null} label="+ New Folder" />
      </div>

      <ul className="mt-2 max-w-2xl divide-y divide-border rounded-lg border border-border bg-background">
        {topLevelFolders.map((folder) => (
          <FolderSection
            key={folder.id}
            folder={folder}
            automations={templatesByFolder[folder.id] ?? []}
            subfolders={folders.filter((f) => f.parent_folder_id === folder.id)}
            templatesByFolder={templatesByFolder}
            folderOptions={folderOptions}
            expandedIds={expandedIds}
            onToggle={toggle}
          />
        ))}

        <li>
          <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/40 px-4 py-2">
            <span className="text-sm font-medium">Uncategorized</span>
            <NewAutomationButton label="+ New Automation" />
          </div>
          {uncategorized.length > 0 ? (
            <ul className="divide-y divide-border">
              {uncategorized.map((template) => (
                <AutomationRow key={template.id} template={template} folderOptions={folderOptions} />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-2 text-sm text-muted-foreground">Nothing here.</p>
          )}
        </li>
      </ul>
    </div>
  )
}

function SearchBox({ query, onChange }: { query: string; onChange: (value: string) => void }) {
  return (
    <input
      type="search"
      value={query}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search automations by name…"
      className="w-full max-w-sm rounded border border-input-border bg-input-background px-3 py-2 text-sm"
    />
  )
}
