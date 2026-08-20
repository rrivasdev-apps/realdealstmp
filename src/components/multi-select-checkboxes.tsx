'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

// Small bounded multi-select (investor types, communication preferences,
// markets, deal types, property types, ...) rendered as a checkbox group --
// same pattern the contact-types fieldset already used, extracted since the
// Investor Criteria/Preferences panel repeats it five times.
//
// onCreate is optional -- only company-configurable lists (markets, states)
// get an inline "+ Add" affordance, matching docs/reference/contact-hub.md's
// "select from an existing list + Add new button" pattern. Fixed global
// lookups (investor types, industries, specialties, ...) omit it since
// there's nothing for a company to add.
export function MultiSelectCheckboxes({
  label,
  options,
  selectedIds,
  onToggle,
  onCreate,
}: {
  label: string
  options: LookupOption[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onCreate?: (name: string) => Promise<LookupOption>
}) {
  const t = useTranslations('Contacts')
  const [createdOptions, setCreatedOptions] = useState<LookupOption[]>([])
  const [draftName, setDraftName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const allOptions = [
    ...options,
    ...createdOptions.filter((created) => !options.some((option) => option.id === created.id)),
  ]

  async function handleCreate() {
    if (!onCreate || !draftName.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const created = await onCreate(draftName.trim())
      setCreatedOptions((prev) => [...prev, created])
      onToggle(created.id)
      setDraftName('')
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : t('couldNotAddError'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <fieldset className="flex flex-col gap-2 text-sm">
      <legend className="mb-1 font-medium">{label}</legend>
      {allOptions.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('noneConfiguredYet')}</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {allOptions.map((option) => (
            <label key={option.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={selectedIds.includes(option.id)}
                onChange={() => onToggle(option.id)}
              />
              {option.name}
            </label>
          ))}
        </div>
      )}
      {onCreate && (
        <div className="flex gap-2">
          <input
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder={t('addNewOptionPlaceholder', { label: label.toLowerCase() })}
            className="flex-1 field-input px-2 py-1"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !draftName.trim()}
            className="rounded border border-input-border px-3 py-1 text-xs disabled:opacity-50"
          >
            {creating ? t('addingButton') : t('addButton')}
          </button>
        </div>
      )}
      {createError && <p className="text-xs text-danger">{createError}</p>}
    </fieldset>
  )
}
