export type AutomationFolder = { id: string; name: string; parent_folder_id: string | null }

export type AutomationListItem = {
  id: string
  name: string
  trigger_type: string
  is_functional: boolean
  folder_id: string | null
  deal_types: { name: string } | null
}

// Flattened folder list for "Move to folder" / builder-page pickers: top-level folders
// followed by their subfolders (label already indented), plus a null-id "Uncategorized" entry.
export type FolderOption = { id: string | null; label: string }

export function buildFolderOptions(folders: AutomationFolder[]): FolderOption[] {
  const topLevel = folders.filter((folder) => !folder.parent_folder_id)
  const options: FolderOption[] = [{ id: null, label: 'Uncategorized' }]

  for (const folder of topLevel) {
    options.push({ id: folder.id, label: folder.name })
    for (const subfolder of folders.filter((f) => f.parent_folder_id === folder.id)) {
      options.push({ id: subfolder.id, label: `${folder.name} / ${subfolder.name}` })
    }
  }

  return options
}
