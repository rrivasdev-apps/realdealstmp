'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

type PhoneRow = { type_id: string; phone: string }
type EmailRow = { type_id: string; email: string }

export type ContactFormValues = {
  id?: string
  name: string
  notes: string
  contactTypeIds: string[]
  phones: PhoneRow[]
  emails: EmailRow[]
}

export function ContactForm({
  mode,
  initialValues,
  contactTypes,
  phoneTypes,
  emailTypes,
}: {
  mode: 'create' | 'edit'
  initialValues: ContactFormValues
  contactTypes: LookupOption[]
  phoneTypes: LookupOption[]
  emailTypes: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleContactType(id: string) {
    setValues((prev) => ({
      ...prev,
      contactTypeIds: prev.contactTypeIds.includes(id)
        ? prev.contactTypeIds.filter((existing) => existing !== id)
        : [...prev.contactTypeIds, id],
    }))
  }

  function addPhone() {
    setValues((prev) => ({
      ...prev,
      phones: [...prev.phones, { type_id: phoneTypes[0]?.id ?? '', phone: '' }],
    }))
  }

  function updatePhone(index: number, patch: Partial<PhoneRow>) {
    setValues((prev) => ({
      ...prev,
      phones: prev.phones.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  }

  function removePhone(index: number) {
    setValues((prev) => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }))
  }

  function addEmail() {
    setValues((prev) => ({
      ...prev,
      emails: [...prev.emails, { type_id: emailTypes[0]?.id ?? '', email: '' }],
    }))
  }

  function updateEmail(index: number, patch: Partial<EmailRow>) {
    setValues((prev) => ({
      ...prev,
      emails: prev.emails.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }))
  }

  function removeEmail(index: number) {
    setValues((prev) => ({ ...prev, emails: prev.emails.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url = mode === 'create' ? '/api/contacts' : `/api/contacts/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        notes: values.notes,
        contactTypeIds: values.contactTypeIds,
        phones: values.phones.filter((row) => row.phone.trim()),
        emails: values.emails.filter((row) => row.email.trim()),
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/contacts')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          type="text"
          required
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-medium">Types</legend>
        <div className="flex flex-wrap gap-3">
          {contactTypes.map((type) => (
            <label key={type.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={values.contactTypeIds.includes(type.id)}
                onChange={() => toggleContactType(type.id)}
              />
              {type.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Phone numbers</span>
          <button type="button" onClick={addPhone} className="text-xs underline">
            + Add phone
          </button>
        </div>
        {values.phones.map((row, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={row.type_id}
              onChange={(event) => updatePhone(index, { type_id: event.target.value })}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {phoneTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="tel"
              value={row.phone}
              onChange={(event) => updatePhone(index, { phone: event.target.value })}
              className="flex-1 rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button type="button" onClick={() => removePhone(index)} className="text-xs text-red-600">
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium">Emails</span>
          <button type="button" onClick={addEmail} className="text-xs underline">
            + Add email
          </button>
        </div>
        {values.emails.map((row, index) => (
          <div key={index} className="flex gap-2">
            <select
              value={row.type_id}
              onChange={(event) => updateEmail(index, { type_id: event.target.value })}
              className="rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {emailTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="email"
              value={row.email}
              onChange={(event) => updateEmail(index, { email: event.target.value })}
              className="flex-1 rounded border border-zinc-300 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button type="button" onClick={() => removeEmail(index)} className="text-xs text-red-600">
              Remove
            </button>
          </div>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          value={values.notes}
          onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
          rows={3}
          className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : mode === 'create' ? 'Create contact' : 'Save changes'}
      </button>
    </form>
  )
}
