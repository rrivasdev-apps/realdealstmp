'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Entry = {
  id: string
  profile_id: string
  profile_name: string
  pay_type: string | null
  pay_rate: number | null
  hours_worked: number | null
  computed_amount: number | null
}

export function RunEntriesForm({
  runId,
  initialEntries,
  isDraft,
}: {
  runId: string
  initialEntries: Entry[]
  isDraft: boolean
}) {
  const router = useRouter()
  const [hours, setHours] = useState<Record<string, string>>(
    Object.fromEntries(initialEntries.map((entry) => [entry.id, entry.hours_worked?.toString() ?? '']))
  )
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/payroll-runs/${runId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entries: initialEntries.map((entry) => ({
          id: entry.id,
          hours_worked: hours[entry.id] ? Number(hours[entry.id]) : null,
        })),
      }),
    })

    setSubmitting(false)

    if (!response.ok) {
      const result = await response.json()
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.refresh()
  }

  async function handleFinalize() {
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/payroll-runs/${runId}/finalize`, { method: 'POST' })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <ul className="divide-y divide-border rounded-lg border border-border bg-background">
          {initialEntries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium">{entry.profile_name}</span>
                <div className="text-muted-foreground">
                  {entry.pay_type === 'hourly' ? `${currency.format(entry.pay_rate ?? 0)}/hr` : 'Salary'}
                </div>
              </div>
              {entry.pay_type === 'hourly' && isDraft ? (
                <label className="flex items-center gap-2 text-sm">
                  Hours
                  <input
                    type="number"
                    step="0.01"
                    value={hours[entry.id] ?? ''}
                    onChange={(event) => setHours((prev) => ({ ...prev, [entry.id]: event.target.value }))}
                    className="w-24 rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              ) : (
                <span>
                  {entry.computed_amount != null
                    ? currency.format(entry.computed_amount)
                    : entry.pay_type === 'salary'
                      ? currency.format(entry.pay_rate ?? 0)
                      : '—'}
                </span>
              )}
            </li>
          ))}
          {initialEntries.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              No employees with a pay rate set yet — add one on the Team page.
            </li>
          )}
        </ul>

        {error && <p className="text-sm text-danger">{error}</p>}

        {isDraft && (
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-fit rounded border border-border px-4 py-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save hours'}
            </button>
            <button
              type="button"
              onClick={handleFinalize}
              disabled={submitting}
              className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
            >
              {submitting ? 'Finalizing…' : 'Finalize run'}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
