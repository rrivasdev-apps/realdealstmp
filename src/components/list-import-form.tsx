'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Textarea-paste bulk import -- one row per line, shared shape for
// /api/countries/import, /api/states/import, /api/cities/import. Not a file upload:
// there's no multipart-parsing precedent anywhere in this app, and paste-from-a-
// spreadsheet covers the same need with far less code.
export function ListImportForm({
  endpoint,
  extraBody,
  placeholder,
  hint,
  onImported,
}: {
  endpoint: string
  extraBody?: Record<string, string>
  placeholder: string
  hint: string
  onImported?: () => void
}) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)
    setSubmitting(true)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ...extraBody }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    setText('')
    setStatus(`Imported ${result.imported} row${result.imported === 1 ? '' : 's'}.`)
    router.refresh()
    onImported?.()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="field-label">
        Import list
        <textarea
          rows={4}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={placeholder}
          className="rounded border border-input-border bg-input-background px-3 py-2 font-mono text-xs"
        />
      </label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <button
        type="submit"
        disabled={submitting || !text.trim()}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Importing…' : 'Import'}
      </button>
      {status && <p className="text-sm text-success">{status}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  )
}
