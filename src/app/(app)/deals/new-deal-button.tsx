'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { AddressFields, type AddressValue, type CountryOption } from '@/components/address-fields'

type LookupOption = { id: string; name: string }

function emptyAddress(defaultCountry?: CountryOption): AddressValue {
  return {
    address: '',
    countryId: defaultCountry?.id ?? '',
    countryName: defaultCountry?.name ?? '',
    stateId: '',
    stateName: '',
    cityId: '',
    cityName: '',
    zipCode: '',
  }
}

// Quick-create popup for "New deal" -- intake usually only has these six-plus-two
// fields, not the full ~75-field form. Landing on the deal's detail page afterward
// (not the whiteboard) is where everything else gets filled in -- DealForm in edit
// mode already exposes every field, so nothing is lost by not asking for it up front.
export function NewDealButton({
  dealTypes,
  leadSources,
  countries,
  defaultCountryId,
}: {
  dealTypes: LookupOption[]
  leadSources: LookupOption[]
  countries: CountryOption[]
  defaultCountryId: string | null
}) {
  const t = useTranslations('Deals')
  const tField = useTranslations('DealForm')
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const defaultCountry = countries.find((country) => country.id === defaultCountryId)
  const [address, setAddress] = useState<AddressValue>(() => emptyAddress(defaultCountry))
  const [dealTypeId, setDealTypeId] = useState('')
  const [leadSourceId, setLeadSourceId] = useState('')
  const [contractPrice, setContractPrice] = useState('')
  const [contractDate, setContractDate] = useState('')
  const [projectedSalesPrice, setProjectedSalesPrice] = useState('')
  const [closingDate, setClosingDate] = useState('')
  const [dueDiligenceDays, setDueDiligenceDays] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleClose() {
    setIsOpen(false)
    setAddress(emptyAddress(defaultCountry))
    setDealTypeId('')
    setLeadSourceId('')
    setContractPrice('')
    setContractDate('')
    setProjectedSalesPrice('')
    setClosingDate('')
    setDueDiligenceDays('')
    setError(null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const response = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: address.address,
        country_id: address.countryId || null,
        state_id: address.stateId || null,
        city_id: address.cityId || null,
        zip_code: address.zipCode || null,
        deal_type_id: dealTypeId,
        lead_source_id: leadSourceId,
        contract_price: Number(contractPrice),
        contract_date: contractDate,
        projected_sales_price: Number(projectedSalesPrice),
        closing_date: closingDate,
        due_diligence_days: Number(dueDiligenceDays),
      }),
    })
    const result = await response.json()
    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('createError'))
      return
    }

    router.push(`/deals/${result.id}`)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t('newDealButton')}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-lg border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold">{t('newDealButton')}</h3>
              <button type="button" onClick={handleClose} aria-label={t('closeLabel')} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <AddressFields value={address} onChange={setAddress} countries={countries} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="field-label">
                  {tField('dealType')}
                  <select
                    required
                    value={dealTypeId}
                    onChange={(event) => setDealTypeId(event.target.value)}
                    className="field-input px-3 py-2"
                  >
                    <option value="" disabled>
                      {t('selectPlaceholder')}
                    </option>
                    {dealTypes.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  {tField('leadSource')}
                  <select
                    required
                    value={leadSourceId}
                    onChange={(event) => setLeadSourceId(event.target.value)}
                    className="field-input px-3 py-2"
                  >
                    <option value="" disabled>
                      {t('selectPlaceholder')}
                    </option>
                    {leadSources.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="field-label">
                  {tField('contractPrice')}
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={contractPrice}
                    onChange={(event) => setContractPrice(event.target.value)}
                    className="field-input px-3 py-2"
                  />
                </label>
                <label className="field-label">
                  {tField('contractDate')}
                  <input
                    type="date"
                    required
                    value={contractDate}
                    onChange={(event) => setContractDate(event.target.value)}
                    className="field-input px-3 py-2"
                  />
                </label>
                <label className="field-label">
                  {tField('projectedSalesPrice')}
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={projectedSalesPrice}
                    onChange={(event) => setProjectedSalesPrice(event.target.value)}
                    className="field-input px-3 py-2"
                  />
                </label>
                <label className="field-label">
                  {tField('closingDate')}
                  <input
                    type="date"
                    required
                    value={closingDate}
                    onChange={(event) => setClosingDate(event.target.value)}
                    className="field-input px-3 py-2"
                  />
                </label>
              </div>

              <label className="field-label">
                {t('dueDiligencePeriodDays')}
                <input
                  type="number"
                  required
                  min={0}
                  value={dueDiligenceDays}
                  onChange={(event) => setDueDiligenceDays(event.target.value)}
                  className="field-input px-3 py-2"
                />
              </label>

              {error && <p className="text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-fit btn-primary"
              >
                {submitting ? t('creatingButton') : t('createDealButton')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
