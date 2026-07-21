'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type LookupOption = { id: string; name: string }

export function EmployeeForm({
  profileId,
  initialEmployeeRoleIds,
  initialCommissionTypeIds,
  initialPayType,
  initialPayRate,
  initialEmployeeType,
  initialHireDate,
  initialBirthDate,
  initialAddress,
  initialPaidVia,
  initialAutomaticEmails,
  initialPayPeriodIds,
  employeeRoles,
  commissionTypes,
  payPeriods,
}: {
  profileId: string
  initialEmployeeRoleIds: string[]
  initialCommissionTypeIds: string[]
  initialPayType: string
  initialPayRate: string
  initialEmployeeType: string
  initialHireDate: string
  initialBirthDate: string
  initialAddress: string
  initialPaidVia: string
  initialAutomaticEmails: boolean
  initialPayPeriodIds: string[]
  employeeRoles: LookupOption[]
  commissionTypes: LookupOption[]
  payPeriods: LookupOption[]
}) {
  const router = useRouter()
  const [employeeRoleIds, setEmployeeRoleIds] = useState<string[]>(initialEmployeeRoleIds)
  const [commissionTypeIds, setCommissionTypeIds] = useState<string[]>(initialCommissionTypeIds)
  const [payPeriodIds, setPayPeriodIds] = useState<string[]>(initialPayPeriodIds)
  const [payType, setPayType] = useState(initialPayType)
  const [payRate, setPayRate] = useState(initialPayRate)
  const [employeeType, setEmployeeType] = useState(initialEmployeeType)
  const [hireDate, setHireDate] = useState(initialHireDate)
  const [birthDate, setBirthDate] = useState(initialBirthDate)
  const [address, setAddress] = useState(initialAddress)
  const [paidVia, setPaidVia] = useState(initialPaidVia)
  const [automaticEmails, setAutomaticEmails] = useState(initialAutomaticEmails)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggleEmployeeRole(id: string) {
    setEmployeeRoleIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  function toggleCommissionType(id: string) {
    setCommissionTypeIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  function togglePayPeriod(id: string) {
    setPayPeriodIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch(`/api/team/${profileId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_role_ids: employeeRoleIds,
        commission_type_ids: commissionTypeIds,
        pay_type: payType || null,
        pay_rate: payRate ? Number(payRate) : null,
        employee_type: employeeType || null,
        hire_date: hireDate || null,
        birth_date: birthDate || null,
        address: address || null,
        paid_via: paidVia || null,
        automatic_emails: automaticEmails,
        pay_period_ids: payPeriodIds,
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/team')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <fieldset className="flex flex-col gap-2 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Employee roles</legend>
        {employeeRoles.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={employeeRoleIds.includes(option.id)}
              onChange={() => toggleEmployeeRole(option.id)}
            />
            {option.name}
          </label>
        ))}
        {employeeRoles.length === 0 && (
          <p className="text-sm text-muted-foreground">No employee roles yet — add some in Settings.</p>
        )}
        <span className="text-xs text-muted-foreground">
          An employee can hold more than one role. Assigning a role pushes its permissions onto this employee; you
          can still fine-tune this employee&apos;s individual permissions afterward.
        </span>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium">Additional info</legend>
        <label className="flex flex-col gap-1 text-sm">
          Employee type
          <select
            value={employeeType}
            onChange={(event) => setEmployeeType(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            <option value="full_time">Full-time employee</option>
            <option value="part_time">Part-time employee</option>
            <option value="contractor">Contractor</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Hire date
          <input
            type="date"
            value={hireDate}
            onChange={(event) => setHireDate(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Birth date
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Paid via
          <input
            type="text"
            value={paidVia}
            onChange={(event) => setPaidVia(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          Address
          <input
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm sm:col-span-2">
          <input
            type="checkbox"
            checked={automaticEmails}
            onChange={(event) => setAutomaticEmails(event.target.checked)}
          />
          Send automatic email notifications to this employee
        </label>
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-4 rounded border border-border p-4 sm:grid-cols-2">
        <legend className="px-1 text-sm font-medium">Pay rate</legend>
        <label className="flex flex-col gap-1 text-sm">
          Pay type
          <select
            value={payType}
            onChange={(event) => setPayType(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            <option value="hourly">Hourly</option>
            <option value="salary">Salary</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {payType === 'salary' ? 'Salary per pay period' : 'Hourly rate'}
          <input
            type="number"
            step="0.01"
            value={payRate}
            onChange={(event) => setPayRate(event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Pay periods</legend>
        {payPeriods.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={payPeriodIds.includes(option.id)}
              onChange={() => togglePayPeriod(option.id)}
            />
            {option.name}
          </label>
        ))}
        {payPeriods.length === 0 && (
          <p className="text-sm text-muted-foreground">No pay periods yet — add some in Settings.</p>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Direct commission types</legend>
        {commissionTypes.map((option) => (
          <label key={option.id} className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={commissionTypeIds.includes(option.id)}
              onChange={() => toggleCommissionType(option.id)}
            />
            {option.name}
          </label>
        ))}
        {commissionTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">No commission types yet — add some in Settings.</p>
        )}
      </fieldset>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Save changes'}
        </button>
        <Link href="/team" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
