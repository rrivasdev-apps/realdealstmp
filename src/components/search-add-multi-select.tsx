'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

type Option = { id: string; name: string }

// Unbounded lookup (cities, zip codes, ...) that can't be preloaded as a flat
// checkbox list -- search-as-you-type against a server endpoint, pick from
// results, optionally create a new one inline (zip codes; cities intentionally
// omit onCreate since creating a city needs a state, out of scope for this
// compact panel -- use Settings or the deal-form's own "+ Add city" instead).
export function SearchAddMultiSelect({
  label,
  selected,
  onAdd,
  onRemove,
  onSearch,
  onCreate,
}: {
  label: string
  selected: Option[]
  onAdd: (option: Option) => void
  onRemove: (id: string) => void
  onSearch: (query: string) => Promise<Option[]>
  onCreate?: (query: string) => Promise<Option>
}) {
  const t = useTranslations('Contacts')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Option[]>([])
  const [showResults, setShowResults] = useState(false)
  const [creating, setCreating] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleQueryChange(value: string) {
    setQuery(value)
    setShowResults(true)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setResults(await onSearch(value))
    }, 300)
  }

  function pick(option: Option) {
    onAdd(option)
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  async function handleCreate() {
    if (!onCreate || !query.trim()) return
    setCreating(true)
    try {
      pick(await onCreate(query.trim()))
    } finally {
      setCreating(false)
    }
  }

  const trimmedQuery = query.trim()
  const exactMatch = results.some((option) => option.name.toLowerCase() === trimmedQuery.toLowerCase())

  return (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder={t('searchPlaceholder', { label: label.toLowerCase() })}
          className="w-full field-input px-2 py-1"
        />
        {showResults && (results.length > 0 || (onCreate && trimmedQuery && !exactMatch)) && (
          <ul className="absolute z-10 mt-1 w-full rounded border border-border bg-background shadow-lg">
            {results.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => pick(option)}
                  className="block w-full px-2 py-1 text-left hover:bg-muted"
                >
                  {option.name}
                </button>
              </li>
            ))}
            {onCreate && trimmedQuery && !exactMatch && (
              <li>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className="block w-full px-2 py-1 text-left text-brand-600 hover:bg-muted disabled:opacity-50"
                >
                  {creating ? t('addingButton') : t('addQuotedButton', { query: trimmedQuery })}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <li
              key={option.id}
              className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs"
            >
              {option.name}
              <button type="button" onClick={() => onRemove(option.id)} className="text-danger">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
