'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CurrencyInput } from '@/components/currency-input'

type LookupOption = { id: string; name: string }

export type DealFormValues = {
  id?: string
  address: string
  market_id: string
  property_type_id: string
  deal_type_id: string
  lead_source_id: string
  status_id: string
  contract_price: string
  contract_date: string
  closing_date: string
  due_diligence_expiration: string
  actual_closing_date: string
  projected_sales_price: string
  buyer_found: boolean
  buyer_contract_price: string
  buyer_contract_date: string
  bc_contract_closing_date: string
  buyer_inspection_deadline: string
  renegotiated_bc_price: string
  buyer_deposit_received: boolean
  buyer_deposit_amount: string
  apn: string
  legal_description: string
  lot_size_acres: string
  ab_purchase_type_id: string
  title_opened: boolean
  title_ordered: boolean
  title_ready: boolean
  poa_needed: boolean
  title_company_contact_id: string
  mortgage_company_contact_id: string
  payoff_ordered: boolean
  mortgage_principal_balance: string
  mortgage_rate: string
  mortgage_term: string
  in_foreclosure: boolean
  foreclosure_date: string
  total_payoff_amount: string
  seller_contact_id: string
  is_listed: boolean
}

export function DealForm({
  mode,
  initialValues,
  markets,
  propertyTypes,
  dealTypes,
  leadSources,
  dealStatuses,
  purchaseTypes,
  titleCompanyContacts,
  mortgageCompanyContacts,
  sellerContacts,
}: {
  mode: 'create' | 'edit'
  initialValues: DealFormValues
  markets: LookupOption[]
  propertyTypes: LookupOption[]
  dealTypes: LookupOption[]
  leadSources: LookupOption[]
  dealStatuses: LookupOption[]
  purchaseTypes: LookupOption[]
  titleCompanyContacts: LookupOption[]
  mortgageCompanyContacts: LookupOption[]
  sellerContacts: LookupOption[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const url = mode === 'create' ? '/api/deals' : `/api/deals/${values.id}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    const payload = {
      address: values.address,
      market_id: values.market_id || null,
      property_type_id: values.property_type_id || null,
      deal_type_id: values.deal_type_id || null,
      lead_source_id: values.lead_source_id || null,
      status_id: values.status_id || undefined,
      contract_price: values.contract_price ? Number(values.contract_price) : null,
      contract_date: values.contract_date || null,
      closing_date: values.closing_date || null,
      due_diligence_expiration: values.due_diligence_expiration || null,
      actual_closing_date: values.actual_closing_date || null,
      projected_sales_price: values.projected_sales_price ? Number(values.projected_sales_price) : null,
      buyer_found: values.buyer_found,
      buyer_contract_price: values.buyer_contract_price ? Number(values.buyer_contract_price) : null,
      buyer_contract_date: values.buyer_contract_date || null,
      bc_contract_closing_date: values.bc_contract_closing_date || null,
      buyer_inspection_deadline: values.buyer_inspection_deadline || null,
      renegotiated_bc_price: values.renegotiated_bc_price ? Number(values.renegotiated_bc_price) : null,
      buyer_deposit_received: values.buyer_deposit_received,
      buyer_deposit_amount: values.buyer_deposit_amount ? Number(values.buyer_deposit_amount) : null,
      apn: values.apn || null,
      legal_description: values.legal_description || null,
      lot_size_acres: values.lot_size_acres ? Number(values.lot_size_acres) : null,
      ab_purchase_type_id: values.ab_purchase_type_id || null,
      title_opened: values.title_opened,
      title_ordered: values.title_ordered,
      title_ready: values.title_ready,
      poa_needed: values.poa_needed,
      title_company_contact_id: values.title_company_contact_id || null,
      mortgage_company_contact_id: values.mortgage_company_contact_id || null,
      payoff_ordered: values.payoff_ordered,
      mortgage_principal_balance: values.mortgage_principal_balance ? Number(values.mortgage_principal_balance) : null,
      mortgage_rate: values.mortgage_rate ? Number(values.mortgage_rate) : null,
      mortgage_term: values.mortgage_term ? Number(values.mortgage_term) : null,
      in_foreclosure: values.in_foreclosure,
      foreclosure_date: values.foreclosure_date || null,
      total_payoff_amount: values.total_payoff_amount ? Number(values.total_payoff_amount) : null,
      seller_contact_id: values.seller_contact_id || null,
      is_listed: values.is_listed,
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm">
        Address
        <input
          type="text"
          required
          value={values.address}
          onChange={(event) => set('address', event.target.value)}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        />
      </label>

      <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Property Facts</legend>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            APN
            <input
              type="text"
              value={values.apn}
              onChange={(event) => set('apn', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Lot size (acres)
            <input
              type="number"
              step="0.01"
              value={values.lot_size_acres}
              onChange={(event) => set('lot_size_acres', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="col-span-2 flex flex-col gap-1 text-sm">
            Legal description
            <textarea
              value={values.legal_description}
              onChange={(event) => set('legal_description', event.target.value)}
              rows={2}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Mortgage company
            <select
              value={values.mortgage_company_contact_id}
              onChange={(event) => set('mortgage_company_contact_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">—</option>
              {mortgageCompanyContacts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Mortgage principal balance
            <CurrencyInput
              value={values.mortgage_principal_balance}
              onChange={(value) => set('mortgage_principal_balance', value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Mortgage rate (%)
            <input
              type="number"
              step="0.01"
              value={values.mortgage_rate}
              onChange={(event) => set('mortgage_rate', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Mortgage term (years)
            <input
              type="number"
              step="1"
              value={values.mortgage_term}
              onChange={(event) => set('mortgage_term', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Total payoff amount
            <CurrencyInput
              value={values.total_payoff_amount}
              onChange={(value) => set('total_payoff_amount', value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Foreclosure date
            <input
              type="date"
              value={values.foreclosure_date}
              onChange={(event) => set('foreclosure_date', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.payoff_ordered}
              onChange={(event) => set('payoff_ordered', event.target.checked)}
            />
            Payoff ordered
          </label>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.in_foreclosure}
              onChange={(event) => set('in_foreclosure', event.target.checked)}
            />
            In foreclosure
          </label>
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Market
          <select
            value={values.market_id}
            onChange={(event) => set('market_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {markets.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Property type
          <select
            value={values.property_type_id}
            onChange={(event) => set('property_type_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {propertyTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Deal type
          <select
            value={values.deal_type_id}
            onChange={(event) => set('deal_type_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {dealTypes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Lead source
          <select
            value={values.lead_source_id}
            onChange={(event) => set('lead_source_id', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          >
            <option value="">—</option>
            {leadSources.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        {mode === 'edit' && (
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              value={values.status_id}
              onChange={(event) => set('status_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              {dealStatuses.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Contract price
          <CurrencyInput
            value={values.contract_price}
            onChange={(value) => set('contract_price', value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Projected sales price
          <CurrencyInput
            value={values.projected_sales_price}
            onChange={(value) => set('projected_sales_price', value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Contract date
          <input
            type="date"
            value={values.contract_date}
            onChange={(event) => set('contract_date', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Closing date
          <input
            type="date"
            value={values.closing_date}
            onChange={(event) => set('closing_date', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Due diligence expiration
          <input
            type="date"
            value={values.due_diligence_expiration}
            onChange={(event) => set('due_diligence_expiration', event.target.value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        {mode === 'edit' && (
          <label className="flex flex-col gap-1 text-sm">
            Actual closing date
            <input
              type="date"
              value={values.actual_closing_date}
              onChange={(event) => set('actual_closing_date', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>
        )}
      </div>

      <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Deal Facts</legend>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.title_opened}
              onChange={(event) => set('title_opened', event.target.checked)}
            />
            Title opened
          </label>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.title_ordered}
              onChange={(event) => set('title_ordered', event.target.checked)}
            />
            Title ordered
          </label>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.title_ready}
              onChange={(event) => set('title_ready', event.target.checked)}
            />
            Title ready
          </label>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.poa_needed}
              onChange={(event) => set('poa_needed', event.target.checked)}
            />
            Are we obtaining POA
          </label>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.is_listed}
              onChange={(event) => set('is_listed', event.target.checked)}
            />
            Listed
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Title company
            <select
              value={values.title_company_contact_id}
              onChange={(event) => set('title_company_contact_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">—</option>
              {titleCompanyContacts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Seller info
            <select
              value={values.seller_contact_id}
              onChange={(event) => set('seller_contact_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">—</option>
              {sellerContacts.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            AB-Purchase type
            <select
              value={values.ab_purchase_type_id}
              onChange={(event) => set('ab_purchase_type_id', event.target.value)}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            >
              <option value="">—</option>
              {purchaseTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </fieldset>

      {mode === 'edit' && (
        <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
          <legend className="px-1 text-sm font-medium">Buyer / BC Contract</legend>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.buyer_found}
              onChange={(event) => set('buyer_found', event.target.checked)}
            />
            Buyer found
          </label>

          {values.buyer_found && (
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1 text-sm">
                Buyer contract price
                {initialValues.buyer_contract_price ? (
                  <>
                    <CurrencyInput
                      value={values.buyer_contract_price}
                      onChange={(value) => set('buyer_contract_price', value)}
                      disabled
                      className="rounded border border-input-border bg-muted px-3 py-2 text-muted-foreground"
                    />
                    <span className="text-xs text-muted-foreground">
                      Locked once set — use Renegotiated BC price below for updates.
                    </span>
                  </>
                ) : (
                  <CurrencyInput
                    value={values.buyer_contract_price}
                    onChange={(value) => set('buyer_contract_price', value)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                )}
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Renegotiated BC price
                <CurrencyInput
                  value={values.renegotiated_bc_price}
                  onChange={(value) => set('renegotiated_bc_price', value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Buyer contract date
                <input
                  type="date"
                  value={values.buyer_contract_date}
                  onChange={(event) => set('buyer_contract_date', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                BC contract closing date
                <input
                  type="date"
                  value={values.bc_contract_closing_date}
                  onChange={(event) => set('bc_contract_closing_date', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Buyer inspection deadline
                <input
                  type="date"
                  value={values.buyer_inspection_deadline}
                  onChange={(event) => set('buyer_inspection_deadline', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Buyer deposit amount
                <CurrencyInput
                  value={values.buyer_deposit_amount}
                  onChange={(value) => set('buyer_deposit_amount', value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>
            </div>
          )}

          {values.buyer_found && (
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={values.buyer_deposit_received}
                onChange={(event) => set('buyer_deposit_received', event.target.checked)}
              />
              Buyer deposit received
            </label>
          )}
        </fieldset>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create deal' : 'Save changes'}
        </button>
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
