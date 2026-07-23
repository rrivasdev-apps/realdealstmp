'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export type PartnerCompanyFormValues = {
  id?: string
  name: string
  address: string
  email: string
  phone: string
  companyTypeIds: string[]
}

export function PartnerCompanyForm({
  mode,
  initialValues,
  companyTypes,
}: {
  mode: 'create' | 'edit'
  initialValues: PartnerCompanyFormValues
  companyTypes: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleCompanyType(id: string) {
    setValues((prev) => ({
      ...prev,
      companyTypeIds: prev.companyTypeIds.includes(id)
        ? prev.companyTypeIds.filter((existing) => existing !== id)
        : [...prev.companyTypeIds, id],
    }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url = mode === 'create' ? '/api/partner-companies' : `/api/partner-companies/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: values.name,
        address: values.address,
        email: values.email,
        phone: values.phone,
        company_type_ids: values.companyTypeIds,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/partner-companies')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Business Name
        <input
          type="text"
          required
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Business Address
        <input
          type="text"
          value={values.address}
          onChange={(event) => setValues((prev) => ({ ...prev, address: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          value={values.email}
          onChange={(event) => setValues((prev) => ({ ...prev, email: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Phone Number
        <input
          type="tel"
          value={values.phone}
          onChange={(event) => setValues((prev) => ({ ...prev, phone: event.target.value }))}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <fieldset className="flex flex-col gap-2 text-sm">
        <legend className="mb-1 font-medium">Type of Company</legend>
        <div className="flex flex-wrap gap-3">
          {companyTypes.map((type) => (
            <label key={type.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={values.companyTypeIds.includes(type.id)}
                onChange={() => toggleCompanyType(type.id)}
              />
              {type.name}
            </label>
          ))}
        </div>
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? 'Saving…' : mode === 'create' ? 'Create company' : 'Save changes'}
      </button>
    </form>
  )
}
