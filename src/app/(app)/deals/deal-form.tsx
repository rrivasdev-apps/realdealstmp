'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { CurrencyInput } from '@/components/currency-input'
import { DealSection } from '@/components/deal-section'
import { calculateProfitCascade } from '@/lib/deals/profit'

import { CustomChecklistItems } from './custom-checklist-items'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type LookupOption = { id: string; name: string }

export type CustomFieldDefinition = {
  id: string
  name: string
  field_type: string
  options: string[] | null
}

export type DealFormValues = {
  id?: string
  address: string
  market_id: string
  property_type_id: string
  deal_type_id: string
  lead_source_id: string
  status_id: string
  contract_price: string
  contract_price_renegotiated_date: string
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
  renegotiated_bc_date: string
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
  is_jv_deal: boolean
  jv_partner_company_id: string
  jv_split_type_id: string
  jv_split_percent: string
  split_amount: string
  total_expenses: string
  total_commissions: string
  checklist_post_occupancy: boolean
  post_occupancy_hold_back_amount: string
  post_occupancy_move_out_date: string
  checklist_survey_needed: boolean
  survey_ordered_date: string
  checklist_initial_photos_needed: boolean
  initial_photos_ordered_date: string
  initial_photos_received_date: string
  checklist_seller_info_sheet_needed: boolean
  seller_info_sheet_sent: boolean
  seller_info_sheet_signed: boolean
  checklist_memo: boolean
  checklist_on_hold: boolean
  on_hold_date: string
  onHoldReasonIds: string[]
  checklist_closing_extension: boolean
  closing_extension_date: string
  checklist_due_diligence_extension: boolean
  due_diligence_extension_date: string
  ab_emd_deposit_received: boolean
  ab_emd_amount: string
  ab_emd_refund: boolean
  bc_emd_refund: boolean
  cancelled_ab: boolean
  cancelled_ab_date: string
  cancelled_ab_party: string
  cancelledAbReasonIds: string[]
  cancelled_bc_ac: boolean
  cancelled_bc_ac_date: string
  cancelled_bc_ac_party: string
  cancelledBcAcReasonIds: string[]
  customFields: Record<string, string | boolean>
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
  investorLlcs,
  splitTypes,
  checklistItems,
  checkedChecklistItemIds,
  onHoldReasons,
  cancelledAbReasons,
  cancelledBcAcReasons,
  customFieldDefinitions,
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
  investorLlcs: LookupOption[]
  splitTypes: LookupOption[]
  checklistItems: LookupOption[]
  checkedChecklistItemIds: string[]
  onHoldReasons: LookupOption[]
  cancelledAbReasons: LookupOption[]
  cancelledBcAcReasons: LookupOption[]
  customFieldDefinitions: CustomFieldDefinition[]
}) {
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function set<K extends keyof DealFormValues>(key: K, value: DealFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function setCustomField(definitionId: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, customFields: { ...prev.customFields, [definitionId]: value } }))
  }

  function toggleId(key: 'onHoldReasonIds' | 'cancelledAbReasonIds' | 'cancelledBcAcReasonIds', id: string) {
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((existing) => existing !== id) : [...prev[key], id],
    }))
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
      is_jv_deal: values.is_jv_deal,
      jv_partner_company_id: values.jv_partner_company_id || null,
      jv_split_type_id: values.jv_split_type_id || null,
      jv_split_percent: values.jv_split_percent ? Number(values.jv_split_percent) : null,
      split_amount: values.split_amount ? Number(values.split_amount) : null,
      total_expenses: values.total_expenses ? Number(values.total_expenses) : null,
      total_commissions: values.total_commissions ? Number(values.total_commissions) : null,
      checklist_post_occupancy: values.checklist_post_occupancy,
      post_occupancy_hold_back_amount: values.post_occupancy_hold_back_amount
        ? Number(values.post_occupancy_hold_back_amount)
        : null,
      post_occupancy_move_out_date: values.post_occupancy_move_out_date || null,
      checklist_survey_needed: values.checklist_survey_needed,
      survey_ordered_date: values.survey_ordered_date || null,
      checklist_initial_photos_needed: values.checklist_initial_photos_needed,
      initial_photos_ordered_date: values.initial_photos_ordered_date || null,
      initial_photos_received_date: values.initial_photos_received_date || null,
      checklist_seller_info_sheet_needed: values.checklist_seller_info_sheet_needed,
      seller_info_sheet_sent: values.seller_info_sheet_sent,
      seller_info_sheet_signed: values.seller_info_sheet_signed,
      checklist_memo: values.checklist_memo,
      checklist_on_hold: values.checklist_on_hold,
      on_hold_date: values.on_hold_date || null,
      onHoldReasonIds: values.onHoldReasonIds,
      checklist_closing_extension: values.checklist_closing_extension,
      closing_extension_date: values.closing_extension_date || null,
      checklist_due_diligence_extension: values.checklist_due_diligence_extension,
      due_diligence_extension_date: values.due_diligence_extension_date || null,
      ab_emd_deposit_received: values.ab_emd_deposit_received,
      ab_emd_amount: values.ab_emd_amount ? Number(values.ab_emd_amount) : null,
      ab_emd_refund: values.ab_emd_refund,
      bc_emd_refund: values.bc_emd_refund,
      cancelled_ab: values.cancelled_ab,
      cancelled_ab_date: values.cancelled_ab_date || null,
      cancelled_ab_party: values.cancelled_ab_party || null,
      cancelledAbReasonIds: values.cancelledAbReasonIds,
      cancelled_bc_ac: values.cancelled_bc_ac,
      cancelled_bc_ac_date: values.cancelled_bc_ac_date || null,
      cancelled_bc_ac_party: values.cancelled_bc_ac_party || null,
      cancelledBcAcReasonIds: values.cancelledBcAcReasonIds,
      custom_fields: values.customFields,
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

    router.push('/deals')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
      <DealSection id="deal-info" title="Deal Info">
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Contract price
          <CurrencyInput
            value={values.contract_price}
            onChange={(value) => set('contract_price', value)}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
          {values.contract_price_renegotiated_date && (
            <span className="text-xs text-muted-foreground">
              Renegotiated {values.contract_price_renegotiated_date}
            </span>
          )}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
      </DealSection>

      {mode === 'edit' && (
        <DealSection id="buyer-bc">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                {values.renegotiated_bc_date && (
                  <span className="text-xs text-muted-foreground">
                    Renegotiated {values.renegotiated_bc_date}
                  </span>
                )}
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
        </DealSection>
      )}

      {mode === 'edit' && (
        <DealSection id="jv-dispo" title="JV & Dispo">
        <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
          <legend className="px-1 text-sm font-medium">JV Deal</legend>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={values.is_jv_deal}
              onChange={(event) => set('is_jv_deal', event.target.checked)}
            />
            Is JV deal
          </label>

          {values.is_jv_deal && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                JV partner company
                <select
                  value={values.jv_partner_company_id}
                  onChange={(event) => set('jv_partner_company_id', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                >
                  <option value="">—</option>
                  {investorLlcs.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Split type
                <select
                  value={values.jv_split_type_id}
                  onChange={(event) => set('jv_split_type_id', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                >
                  <option value="">—</option>
                  {splitTypes.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Split percent
                <input
                  type="number"
                  step="0.01"
                  value={values.jv_split_percent}
                  onChange={(event) => set('jv_split_percent', event.target.value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                Split amount
                <CurrencyInput
                  value={values.split_amount}
                  onChange={(value) => set('split_amount', value)}
                  className="rounded border border-input-border bg-input-background px-3 py-2"
                />
              </label>
            </div>
          )}
        </fieldset>
        </DealSection>
      )}

      {mode === 'edit' && (
        <DealSection id="financial">
        <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
          <legend className="px-1 text-sm font-medium">Financial</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Total expenses
              <CurrencyInput
                value={values.total_expenses}
                onChange={(value) => set('total_expenses', value)}
                className="rounded border border-input-border bg-input-background px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              Total commissions
              <CurrencyInput
                value={values.total_commissions}
                onChange={(value) => set('total_commissions', value)}
                className="rounded border border-input-border bg-input-background px-3 py-2"
              />
            </label>
          </div>

          <div className="flex flex-col gap-1 rounded bg-muted px-3 py-2 text-sm">
            {(() => {
              const cascade = calculateProfitCascade({
                contract_price: values.contract_price ? Number(values.contract_price) : null,
                renegotiated_bc_price: values.renegotiated_bc_price ? Number(values.renegotiated_bc_price) : null,
                buyer_contract_price: values.buyer_contract_price ? Number(values.buyer_contract_price) : null,
                projected_sales_price: values.projected_sales_price ? Number(values.projected_sales_price) : null,
                total_expenses: values.total_expenses ? Number(values.total_expenses) : null,
                total_commissions: values.total_commissions ? Number(values.total_commissions) : null,
                is_jv_deal: values.is_jv_deal,
                split_amount: values.split_amount ? Number(values.split_amount) : null,
              })

              const rows: [string, number | null][] = [
                ['Estimated projected profit', cascade.estimatedProjectedProfit],
                ['Estimated gross profit', cascade.estimatedGrossProfit],
                ['Estimated net profit before commissions', cascade.estimatedNetProfitBeforeCommissions],
                ['Estimated net profit', cascade.estimatedNetProfit],
              ]

              return rows.map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{amount != null ? currency.format(amount) : '—'}</span>
                </div>
              ))
            })()}
          </div>
        </fieldset>
        </DealSection>
      )}

      {mode === 'edit' && (
        <DealSection id="checklist">
        <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
          <legend className="px-1 text-sm font-medium">Checklist</legend>

          <div className="flex flex-col gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_post_occupancy}
                  onChange={(event) => set('checklist_post_occupancy', event.target.checked)}
                />
                Post occupancy
              </label>
              {values.checklist_post_occupancy && (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    Hold back dollar amount
                    <CurrencyInput
                      value={values.post_occupancy_hold_back_amount}
                      onChange={(value) => set('post_occupancy_hold_back_amount', value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Move out date
                    <input
                      type="date"
                      value={values.post_occupancy_move_out_date}
                      onChange={(event) => set('post_occupancy_move_out_date', event.target.value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_survey_needed}
                  onChange={(event) => set('checklist_survey_needed', event.target.checked)}
                />
                Survey needed
              </label>
              {values.checklist_survey_needed && (
                <label className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
                  Survey ordered
                  <input
                    type="date"
                    value={values.survey_ordered_date}
                    onChange={(event) => set('survey_ordered_date', event.target.value)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_initial_photos_needed}
                  onChange={(event) => set('checklist_initial_photos_needed', event.target.checked)}
                />
                Initial photos needed
              </label>
              {values.checklist_initial_photos_needed && (
                <div className="mt-2 grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    Initial photos ordered
                    <input
                      type="date"
                      value={values.initial_photos_ordered_date}
                      onChange={(event) => set('initial_photos_ordered_date', event.target.value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    Initial photos received
                    <input
                      type="date"
                      value={values.initial_photos_received_date}
                      onChange={(event) => set('initial_photos_received_date', event.target.value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_seller_info_sheet_needed}
                  onChange={(event) => set('checklist_seller_info_sheet_needed', event.target.checked)}
                />
                Seller info sheet needed
              </label>
              {values.checklist_seller_info_sheet_needed && (
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={values.seller_info_sheet_sent}
                      onChange={(event) => set('seller_info_sheet_sent', event.target.checked)}
                    />
                    Seller info sheet sent
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={values.seller_info_sheet_signed}
                      onChange={(event) => set('seller_info_sheet_signed', event.target.checked)}
                    />
                    Seller info sheet signed
                  </label>
                </div>
              )}
            </div>

            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={values.checklist_memo}
                onChange={(event) => set('checklist_memo', event.target.checked)}
              />
              Memo
            </label>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_on_hold}
                  onChange={(event) => set('checklist_on_hold', event.target.checked)}
                />
                On hold
              </label>
              {values.checklist_on_hold && (
                <div className="mt-2 flex flex-col gap-3">
                  <label className="flex max-w-xs flex-col gap-1 text-sm">
                    On hold date
                    <input
                      type="date"
                      value={values.on_hold_date}
                      onChange={(event) => set('on_hold_date', event.target.value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                  {onHoldReasons.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">On hold reasons</span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {onHoldReasons.map((reason) => (
                          <label key={reason.id} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={values.onHoldReasonIds.includes(reason.id)}
                              onChange={() => toggleId('onHoldReasonIds', reason.id)}
                            />
                            {reason.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_closing_extension}
                  onChange={(event) => set('checklist_closing_extension', event.target.checked)}
                />
                Closing extension
              </label>
              {values.checklist_closing_extension && (
                <label className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
                  Extension closing date
                  <input
                    type="date"
                    value={values.closing_extension_date}
                    onChange={(event) => set('closing_extension_date', event.target.value)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.checklist_due_diligence_extension}
                  onChange={(event) => set('checklist_due_diligence_extension', event.target.checked)}
                />
                Due diligence extension
              </label>
              {values.checklist_due_diligence_extension && (
                <label className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
                  DD extension date
                  <input
                    type="date"
                    value={values.due_diligence_extension_date}
                    onChange={(event) => set('due_diligence_extension_date', event.target.value)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.ab_emd_deposit_received}
                  onChange={(event) => set('ab_emd_deposit_received', event.target.checked)}
                />
                AB EMD deposit received
              </label>
              {values.ab_emd_deposit_received && (
                <div className="mt-2 flex flex-wrap items-end gap-4">
                  <label className="flex max-w-xs flex-col gap-1 text-sm">
                    AB EMD amount
                    <CurrencyInput
                      value={values.ab_emd_amount}
                      onChange={(value) => set('ab_emd_amount', value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={values.ab_emd_refund}
                      onChange={(event) => set('ab_emd_refund', event.target.checked)}
                    />
                    EMD refund
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.buyer_deposit_received}
                  disabled
                  className="opacity-50"
                />
                BC EMD deposit received
                <span className="text-xs text-muted-foreground">(edit in Buyer / BC Contract above)</span>
              </label>
              {values.buyer_deposit_received && (
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Amount:{' '}
                    {values.buyer_deposit_amount ? currency.format(Number(values.buyer_deposit_amount)) : '—'}
                  </p>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={values.bc_emd_refund}
                      onChange={(event) => set('bc_emd_refund', event.target.checked)}
                    />
                    EMD refund
                  </label>
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(values.contract_price_renegotiated_date)}
                  disabled
                  className="opacity-50"
                />
                Renegotiation AB
                <span className="text-xs text-muted-foreground">(edit Contract price above)</span>
              </label>
              {values.contract_price_renegotiated_date && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {values.contract_price ? currency.format(Number(values.contract_price)) : '—'} — renegotiated{' '}
                  {values.contract_price_renegotiated_date}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(values.renegotiated_bc_date)}
                  disabled
                  className="opacity-50"
                />
                Renegotiation BC
                <span className="text-xs text-muted-foreground">(edit Renegotiated BC price above)</span>
              </label>
              {values.renegotiated_bc_date && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {values.renegotiated_bc_price ? currency.format(Number(values.renegotiated_bc_price)) : '—'} —
                  renegotiated {values.renegotiated_bc_date}
                </p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.cancelled_ab}
                  onChange={(event) => set('cancelled_ab', event.target.checked)}
                />
                Cancelled — AB
              </label>
              {values.cancelled_ab && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      Cancelled date
                      <input
                        type="date"
                        value={values.cancelled_ab_date}
                        onChange={(event) => set('cancelled_ab_date', event.target.value)}
                        className="rounded border border-input-border bg-input-background px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Cancelled AB party
                      <select
                        value={values.cancelled_ab_party}
                        onChange={(event) => set('cancelled_ab_party', event.target.value)}
                        className="rounded border border-input-border bg-input-background px-3 py-2"
                      >
                        <option value="">Choose an option…</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                        <option value="us">Us</option>
                      </select>
                    </label>
                  </div>
                  {cancelledAbReasons.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">Cancelled-AB reasons</span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {cancelledAbReasons.map((reason) => (
                          <label key={reason.id} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={values.cancelledAbReasonIds.includes(reason.id)}
                              onChange={() => toggleId('cancelledAbReasonIds', reason.id)}
                            />
                            {reason.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.cancelled_bc_ac}
                  onChange={(event) => set('cancelled_bc_ac', event.target.checked)}
                />
                Cancelled — BC/AC
              </label>
              {values.cancelled_bc_ac && (
                <div className="mt-2 flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-sm">
                      Cancelled date
                      <input
                        type="date"
                        value={values.cancelled_bc_ac_date}
                        onChange={(event) => set('cancelled_bc_ac_date', event.target.value)}
                        className="rounded border border-input-border bg-input-background px-3 py-2"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Cancelled BC/AC party
                      <select
                        value={values.cancelled_bc_ac_party}
                        onChange={(event) => set('cancelled_bc_ac_party', event.target.value)}
                        className="rounded border border-input-border bg-input-background px-3 py-2"
                      >
                        <option value="">Choose an option…</option>
                        <option value="seller">Seller</option>
                        <option value="buyer">Buyer</option>
                        <option value="us">Us</option>
                      </select>
                    </label>
                  </div>
                  {cancelledBcAcReasons.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">Cancelled-BC/AC reasons</span>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {cancelledBcAcReasons.map((reason) => (
                          <label key={reason.id} className="flex items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={values.cancelledBcAcReasonIds.includes(reason.id)}
                              onChange={() => toggleId('cancelledBcAcReasonIds', reason.id)}
                            />
                            {reason.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {values.id && (
              <CustomChecklistItems
                dealId={values.id}
                availableItems={checklistItems}
                initialCheckedIds={checkedChecklistItemIds}
              />
            )}
          </div>
        </fieldset>
        </DealSection>
      )}

      <DealSection id="custom-fields" title="Custom Fields">
      <fieldset className="flex flex-col gap-4 rounded border border-border p-4">
        <legend className="px-1 text-sm font-medium">Custom Fields</legend>

        {customFieldDefinitions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No custom fields defined yet. Add some in Settings under Deal → Custom Fields.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {customFieldDefinitions.map((definition) => {
              const rawValue = values.customFields[definition.id]
              if (definition.field_type === 'checkbox') {
                return (
                  <label key={definition.id} className="flex items-center gap-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(rawValue)}
                      onChange={(event) => setCustomField(definition.id, event.target.checked)}
                    />
                    {definition.name}
                  </label>
                )
              }

              const stringValue = typeof rawValue === 'string' ? rawValue : ''

              if (definition.field_type === 'select') {
                return (
                  <label key={definition.id} className="flex flex-col gap-1 text-sm">
                    {definition.name}
                    <select
                      value={stringValue}
                      onChange={(event) => setCustomField(definition.id, event.target.value)}
                      className="rounded border border-input-border bg-input-background px-3 py-2"
                    >
                      <option value="">—</option>
                      {(definition.options ?? []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              }

              return (
                <label key={definition.id} className="flex flex-col gap-1 text-sm">
                  {definition.name}
                  <input
                    type={definition.field_type === 'number' ? 'number' : definition.field_type === 'date' ? 'date' : 'text'}
                    value={stringValue}
                    onChange={(event) => setCustomField(definition.id, event.target.value)}
                    className="rounded border border-input-border bg-input-background px-3 py-2"
                  />
                </label>
              )
            })}
          </div>
        )}
      </fieldset>
      </DealSection>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create deal' : 'Save changes'}
        </button>
        <Link href="/deals" className="text-sm text-muted-foreground hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  )
}
