'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { contactTypeColors } from '@/lib/contacts/type-colors'

type ContactType = { id: string; name: string }

type Contact = {
  id: string
  name: string
  notes: string | null
  typeIds: string[]
  typeNames: string[]
  phones: string[]
  emails: string[]
}

export function ContactsList({ contacts, contactTypes }: { contacts: Contact[]; contactTypes: ContactType[] }) {
  const [activeTypeId, setActiveTypeId] = useState<string>('all')
  const [query, setQuery] = useState('')

  const countsByType = useMemo(() => {
    const counts = new Map<string, number>()
    for (const type of contactTypes) counts.set(type.id, 0)
    for (const contact of contacts) {
      for (const typeId of contact.typeIds) {
        counts.set(typeId, (counts.get(typeId) ?? 0) + 1)
      }
    }
    return counts
  }, [contacts, contactTypes])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return contacts.filter((contact) => {
      if (activeTypeId !== 'all' && !contact.typeIds.includes(activeTypeId)) return false
      if (!normalizedQuery) return true

      const haystack = [contact.name, ...contact.typeNames, ...contact.phones, ...contact.emails]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }, [contacts, activeTypeId, query])

  return (
    <div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <button
          type="button"
          onClick={() => setActiveTypeId('all')}
          className={`flex h-20 flex-col justify-center rounded-lg border p-3 text-left transition-colors ${
            activeTypeId === 'all' ? 'border-brand-600 bg-brand-600/5' : 'border-border bg-background hover:bg-muted/50'
          }`}
        >
          <div className="text-xs font-medium uppercase tracking-wide text-foreground">All</div>
          <div className="mt-1 text-xl font-semibold text-foreground">{contacts.length}</div>
        </button>
        {contactTypes.map((type) => {
          const colors = contactTypeColors(type.name)
          const isActive = activeTypeId === type.id
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveTypeId(type.id)}
              className={`flex h-20 flex-col justify-center rounded-lg border p-3 text-left transition-colors ${colors.bg} ${
                isActive ? 'border-brand-600 ring-1 ring-brand-600' : 'border-border hover:brightness-95'
              }`}
            >
              <div className={`truncate text-xs font-medium uppercase tracking-wide ${colors.text}`}>{type.name}</div>
              <div className="mt-1 text-xl font-semibold text-foreground">{countsByType.get(type.id) ?? 0}</div>
            </button>
          )
        })}
      </div>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter by name, type, phone, or email…"
        className="mt-4 w-full max-w-md rounded border border-input-border bg-input-background px-3 py-2 text-sm"
      />

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
        {filtered.map((contact) => (
          <li key={contact.id} className="px-4 py-1.5">
            <Link href={`/contacts/${contact.id}`} className="text-sm font-medium hover:underline">
              {contact.name}
            </Link>
            <div className="text-xs text-muted-foreground">
              {[contact.typeNames.join(', '), contact.phones[0], contact.emails[0]].filter(Boolean).join(' · ') ||
                'No details yet'}
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="px-4 py-1.5 text-sm text-muted-foreground">
            {contacts.length === 0 ? 'No contacts yet.' : 'No contacts match this filter.'}
          </li>
        )}
      </ul>
    </div>
  )
}
