'use client'

import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { MultiSelectCheckboxes } from '@/components/multi-select-checkboxes'
import { SearchAddMultiSelect } from '@/components/search-add-multi-select'
import { contactTypeColors } from '@/lib/contacts/type-colors'
import type messages from '@/messages/en.json'

type ContactsKey = keyof (typeof messages)['Contacts']

import { ListingsPanel, type Listing } from './listings-panel'

type LookupOption = { id: string; name: string }

type PhoneRow = { type_id: string; phone: string }
type EmailRow = { type_id: string; email: string }

export type ContactOffer = {
  id: string
  dealId: string
  dealAddress: string
  offerPrice: number | null
  statusName: string | null
}

export type ContactMeta = {
  createdByName: string | null
  createdAt: string | null
  updatedAt: string | null
}

type NamedOption = { id: string; name: string }

export type ContactFormValues = {
  id?: string
  name: string
  notes: string
  contactTypeIds: string[]
  phones: PhoneRow[]
  emails: EmailRow[]
  partnerCompanyIds: string[]
  last_contacted_at: string
  investorTypeIds: string[]
  communicationPreferenceIds: string[]
  marketIdsInterested: string[]
  dealTypeIdsInterested: string[]
  propertyTypeIdsInterested: string[]
  citiesInterested: NamedOption[]
  zipCodesInterested: NamedOption[]
  realtorIndustryIds: string[]
  realtorAssetTypeIds: string[]
  realtorSpecialtyIds: string[]
  stateIdsServing: string[]
  marketIdsServing: string[]
  citiesServing: NamedOption[]
  zipCodesServing: NamedOption[]
}

// Sub-nav per contact type, from docs/reference/contact-hub.md's 3-column
// detail view. Only 'company' (Add/Link/Remove partner companies) and
// 'offers' (this contact's offers across deals) have real content today --
// everything else renders a "coming soon" placeholder rather than faking
// functionality that isn't built yet (Investor Criteria/Preferences, Realtor
// specialties/Listings/Areas of Coverage are all future Contact Hub work).
type SubNavItem = { key: string; label: string }

function getSubNavItems(typeName: string, t: (key: ContactsKey) => string): SubNavItem[] {
  switch (typeName) {
    case 'Investor':
      return [
        { key: 'criteria', label: t('subNavCriteria') },
        { key: 'company', label: t('subNavLlcDetails') },
        { key: 'offers', label: t('subNavOffers') },
      ]
    case 'Realtor':
      return [
        { key: 'company', label: t('subNavBrokerage') },
        { key: 'realtor_details', label: t('subNavRealtorDetails') },
        { key: 'listings', label: t('subNavListings') },
        { key: 'areas_of_coverage', label: t('subNavAreasOfCoverage') },
        { key: 'offers', label: t('subNavOffers') },
      ]
    default:
      // Offers only ever reference a realtor_contact_id or investor_contact_id
      // (see the offers table) -- Seller/Lender/Vendor/Mortgage Company/Title
      // Company/Other contacts can never be tied to one, so no Offers tab here.
      return [{ key: 'company', label: t('subNavLinkedCompany') }]
  }
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function ContactForm({
  mode,
  initialValues,
  contactTypes,
  phoneTypes,
  emailTypes,
  partnerCompanies,
  offers,
  meta,
  investorTypes,
  communicationPreferences,
  markets,
  dealTypes,
  propertyTypes,
  realtorIndustries,
  realtorAssetTypes,
  realtorSpecialties,
  states,
  defaultCountryId,
  listings,
  listingStatuses,
}: {
  mode: 'create' | 'edit'
  initialValues: ContactFormValues
  contactTypes: LookupOption[]
  phoneTypes: LookupOption[]
  emailTypes: LookupOption[]
  partnerCompanies: LookupOption[]
  offers: ContactOffer[]
  meta: ContactMeta
  investorTypes: LookupOption[]
  communicationPreferences: LookupOption[]
  markets: LookupOption[]
  dealTypes: LookupOption[]
  propertyTypes: LookupOption[]
  realtorIndustries: LookupOption[]
  realtorAssetTypes: LookupOption[]
  realtorSpecialties: LookupOption[]
  states: LookupOption[]
  defaultCountryId: string | null
  listings: Listing[]
  listingStatuses: LookupOption[]
}) {
  const t = useTranslations('Contacts')
  // These timestamps were formatted as 'en-US' regardless of language, so a
  // Spanish company read "8/11/2026" as 8 November rather than 11 August.
  const locale = useLocale()
  const router = useRouter()
  const [values, setValues] = useState(initialValues)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [companyToLink, setCompanyToLink] = useState('')
  const [showTypesEditor, setShowTypesEditor] = useState(values.contactTypeIds.length === 0)
  const [activeTypeId, setActiveTypeId] = useState<string | null>(values.contactTypeIds[0] ?? null)
  const [activeSubNavKey, setActiveSubNavKey] = useState<string>('company')

  const selectedTypes = contactTypes.filter((type) => values.contactTypeIds.includes(type.id))
  const effectiveActiveTypeId =
    activeTypeId && values.contactTypeIds.includes(activeTypeId) ? activeTypeId : (selectedTypes[0]?.id ?? null)
  const activeType = selectedTypes.find((type) => type.id === effectiveActiveTypeId) ?? null
  const subNavItems = activeType ? getSubNavItems(activeType.name, t) : []
  const effectiveSubNavKey = subNavItems.some((item) => item.key === activeSubNavKey)
    ? activeSubNavKey
    : (subNavItems[0]?.key ?? '')

  function toggleContactType(id: string) {
    setValues((prev) => ({
      ...prev,
      contactTypeIds: prev.contactTypeIds.includes(id)
        ? prev.contactTypeIds.filter((existing) => existing !== id)
        : [...prev.contactTypeIds, id],
    }))
  }

  function toggleListId(
    key:
      | 'investorTypeIds'
      | 'communicationPreferenceIds'
      | 'marketIdsInterested'
      | 'dealTypeIdsInterested'
      | 'propertyTypeIdsInterested'
      | 'realtorIndustryIds'
      | 'realtorAssetTypeIds'
      | 'realtorSpecialtyIds'
      | 'stateIdsServing'
      | 'marketIdsServing',
    id: string
  ) {
    setValues((prev) => ({
      ...prev,
      [key]: prev[key].includes(id) ? prev[key].filter((existing) => existing !== id) : [...prev[key], id],
    }))
  }

  function addNamedOption(
    key: 'citiesInterested' | 'zipCodesInterested' | 'citiesServing' | 'zipCodesServing',
    option: NamedOption
  ) {
    setValues((prev) =>
      prev[key].some((existing) => existing.id === option.id) ? prev : { ...prev, [key]: [...prev[key], option] }
    )
  }

  function removeNamedOption(
    key: 'citiesInterested' | 'zipCodesInterested' | 'citiesServing' | 'zipCodesServing',
    id: string
  ) {
    setValues((prev) => ({ ...prev, [key]: prev[key].filter((existing) => existing.id !== id) }))
  }

  async function searchCities(query: string): Promise<NamedOption[]> {
    const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`)
    return response.ok ? response.json() : []
  }

  async function searchZipCodes(query: string): Promise<NamedOption[]> {
    const response = await fetch(`/api/zip-codes?q=${encodeURIComponent(query)}`)
    return response.ok ? response.json() : []
  }

  async function createZipCode(code: string): Promise<NamedOption> {
    const response = await fetch('/api/zip-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    if (!response.ok) throw new Error(t('createZipCodeError'))
    return response.json()
  }

  async function createMarket(name: string): Promise<LookupOption> {
    const response = await fetch('/api/markets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (!response.ok) throw new Error(t('createMarketError'))
    return response.json()
  }

  async function createState(name: string): Promise<LookupOption> {
    if (!defaultCountryId) throw new Error(t('noDefaultCountryError'))
    const response = await fetch('/api/states', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, country_id: defaultCountryId }),
    })
    if (!response.ok) throw new Error(t('createStateError'))
    return response.json()
  }

  function linkPartnerCompany(id: string) {
    if (!id || values.partnerCompanyIds.includes(id)) return
    setValues((prev) => ({ ...prev, partnerCompanyIds: [...prev.partnerCompanyIds, id] }))
  }

  function unlinkPartnerCompany(id: string) {
    setValues((prev) => ({ ...prev, partnerCompanyIds: prev.partnerCompanyIds.filter((existing) => existing !== id) }))
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
        partnerCompanyIds: values.partnerCompanyIds,
        last_contacted_at: values.last_contacted_at || null,
        investorTypeIds: values.investorTypeIds,
        communicationPreferenceIds: values.communicationPreferenceIds,
        marketIdsInterested: values.marketIdsInterested,
        dealTypeIdsInterested: values.dealTypeIdsInterested,
        propertyTypeIdsInterested: values.propertyTypeIdsInterested,
        cityIdsInterested: values.citiesInterested.map((option) => option.id),
        zipCodeIdsInterested: values.zipCodesInterested.map((option) => option.id),
        realtorIndustryIds: values.realtorIndustryIds,
        realtorAssetTypeIds: values.realtorAssetTypeIds,
        realtorSpecialtyIds: values.realtorSpecialtyIds,
        stateIdsServing: values.stateIdsServing,
        marketIdsServing: values.marketIdsServing,
        cityIdsServing: values.citiesServing.map((option) => option.id),
        zipCodeIdsServing: values.zipCodesServing.map((option) => option.id),
      }),
    })
    const result = await response.json()

    setSubmitting(false)

    if (!response.ok) {
      setError(result.error ?? t('genericError'))
      return
    }

    router.push('/contacts')
    router.refresh()
  }

  const linkedCompaniesPanel = (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {subNavItems.find((item) => item.key === 'company')?.label ?? t('subNavLinkedCompany')}
        </span>
        <Link href="/partner-companies/new" target="_blank" className="text-xs underline">
          {t('addNewCompanyLink')}
        </Link>
      </div>
      {partnerCompanies.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('noCompaniesYetMessage')}</p>
      ) : (
        <>
          {(() => {
            const linkableCompanies = partnerCompanies.filter(
              (company) => !values.partnerCompanyIds.includes(company.id)
            )
            return linkableCompanies.length > 0 ? (
              <div className="flex gap-2">
                <select
                  value={companyToLink}
                  onChange={(event) => setCompanyToLink(event.target.value)}
                  className="flex-1 rounded border border-input-border bg-input-background px-2 py-1"
                >
                  <option value="">{t('selectCompanyToLinkPlaceholder')}</option>
                  {linkableCompanies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    linkPartnerCompany(companyToLink)
                    setCompanyToLink('')
                  }}
                  disabled={!companyToLink}
                  className="rounded border border-input-border px-3 py-1 text-xs disabled:opacity-50"
                >
                  {t('linkButton')}
                </button>
              </div>
            ) : null
          })()}

          {values.partnerCompanyIds.length > 0 && (
            <ul className="flex flex-col gap-1">
              {values.partnerCompanyIds.map((id) => {
                const company = partnerCompanies.find((option) => option.id === id)
                return (
                  <li key={id} className="flex items-center justify-between rounded border border-border px-2 py-1">
                    <span>{company?.name ?? t('unknownCompany')}</span>
                    <button type="button" onClick={() => unlinkPartnerCompany(id)} className="text-xs text-danger">
                      {t('removeButton')}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </div>
  )

  const offersPanel = (
    <div className="flex flex-col gap-2 text-sm">
      <span className="font-medium">{t('subNavOffers')}</span>
      {mode === 'create' ? (
        <p className="text-xs text-muted-foreground">{t('saveContactFirstForOffers')}</p>
      ) : offers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('noOffersYet')}</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded border border-border px-2 py-1.5">
              <Link href={`/deals/${offer.dealId}/offers/${offer.id}`} className="font-medium hover:underline">
                {offer.dealAddress}
              </Link>
              <div className="text-xs text-muted-foreground">
                {[offer.offerPrice != null ? currency.format(offer.offerPrice) : null, offer.statusName]
                  .filter(Boolean)
                  .join(' · ') || t('noDetailsYet')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  const criteriaPanel = (
    <div className="flex flex-col gap-4">
      <MultiSelectCheckboxes
        label={t('investorTypeLabel')}
        options={investorTypes}
        selectedIds={values.investorTypeIds}
        onToggle={(id) => toggleListId('investorTypeIds', id)}
      />
      <MultiSelectCheckboxes
        label={t('communicationPreferencesLabel')}
        options={communicationPreferences}
        selectedIds={values.communicationPreferenceIds}
        onToggle={(id) => toggleListId('communicationPreferenceIds', id)}
      />
      <MultiSelectCheckboxes
        label={t('marketsInterestedLabel')}
        options={markets}
        selectedIds={values.marketIdsInterested}
        onToggle={(id) => toggleListId('marketIdsInterested', id)}
        onCreate={createMarket}
      />
      <SearchAddMultiSelect
        label={t('citiesInterestedLabel')}
        selected={values.citiesInterested}
        onAdd={(option) => addNamedOption('citiesInterested', option)}
        onRemove={(id) => removeNamedOption('citiesInterested', id)}
        onSearch={searchCities}
      />
      <SearchAddMultiSelect
        label={t('zipCodesInterestedLabel')}
        selected={values.zipCodesInterested}
        onAdd={(option) => addNamedOption('zipCodesInterested', option)}
        onRemove={(id) => removeNamedOption('zipCodesInterested', id)}
        onSearch={searchZipCodes}
        onCreate={createZipCode}
      />
      <MultiSelectCheckboxes
        label={t('dealTypesInterestedLabel')}
        options={dealTypes}
        selectedIds={values.dealTypeIdsInterested}
        onToggle={(id) => toggleListId('dealTypeIdsInterested', id)}
      />
      <MultiSelectCheckboxes
        label={t('propertyTypesInterestedLabel')}
        options={propertyTypes}
        selectedIds={values.propertyTypeIdsInterested}
        onToggle={(id) => toggleListId('propertyTypeIdsInterested', id)}
      />
    </div>
  )

  const realtorDetailsPanel = (
    <div className="flex flex-col gap-4">
      <MultiSelectCheckboxes
        label={t('realtorIndustriesLabel')}
        options={realtorIndustries}
        selectedIds={values.realtorIndustryIds}
        onToggle={(id) => toggleListId('realtorIndustryIds', id)}
      />
      <MultiSelectCheckboxes
        label={t('realtorAssetTypesLabel')}
        options={realtorAssetTypes}
        selectedIds={values.realtorAssetTypeIds}
        onToggle={(id) => toggleListId('realtorAssetTypeIds', id)}
      />
      <MultiSelectCheckboxes
        label={t('realtorSpecialtiesLabel')}
        options={realtorSpecialties}
        selectedIds={values.realtorSpecialtyIds}
        onToggle={(id) => toggleListId('realtorSpecialtyIds', id)}
      />
    </div>
  )

  const areasOfCoveragePanel = (
    <div className="flex flex-col gap-4">
      <MultiSelectCheckboxes
        label={t('statesServingLabel')}
        options={states}
        selectedIds={values.stateIdsServing}
        onToggle={(id) => toggleListId('stateIdsServing', id)}
        onCreate={createState}
      />
      <MultiSelectCheckboxes
        label={t('marketsServingLabel')}
        options={markets}
        selectedIds={values.marketIdsServing}
        onToggle={(id) => toggleListId('marketIdsServing', id)}
        onCreate={createMarket}
      />
      <SearchAddMultiSelect
        label={t('citiesServingLabel')}
        selected={values.citiesServing}
        onAdd={(option) => addNamedOption('citiesServing', option)}
        onRemove={(id) => removeNamedOption('citiesServing', id)}
        onSearch={searchCities}
      />
      <SearchAddMultiSelect
        label={t('zipCodesServingLabel')}
        selected={values.zipCodesServing}
        onAdd={(option) => addNamedOption('zipCodesServing', option)}
        onRemove={(id) => removeNamedOption('zipCodesServing', id)}
        onSearch={searchZipCodes}
        onCreate={createZipCode}
      />
    </div>
  )

  function renderDetailPanel() {
    if (!activeType) {
      return <p className="text-sm text-muted-foreground">{t('addContactTypeToSeeOptions')}</p>
    }
    if (effectiveSubNavKey === 'company') return linkedCompaniesPanel
    if (effectiveSubNavKey === 'offers') return offersPanel
    if (effectiveSubNavKey === 'criteria') return criteriaPanel
    if (effectiveSubNavKey === 'realtor_details') return realtorDetailsPanel
    if (effectiveSubNavKey === 'areas_of_coverage') return areasOfCoveragePanel
    if (effectiveSubNavKey === 'listings') {
      return <ListingsPanel contactId={values.id ?? null} initialListings={listings} listingStatuses={listingStatuses} />
    }

    const label = subNavItems.find((item) => item.key === effectiveSubNavKey)?.label ?? ''
    return (
      <div className="flex flex-col gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <p className="text-xs text-muted-foreground">{t('comingSoon')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="field-label">
          {t('nameLabel')}
          <input
            type="text"
            required
            value={values.name}
            onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
            className="rounded border border-input-border bg-input-background px-3 py-2"
          />
        </label>

        {mode === 'edit' && (
          <div className="flex flex-col justify-end gap-1 text-xs text-muted-foreground">
            <div>{t('createdByLabel', { name: meta.createdByName ?? t('unknownPerson') })}</div>
            <div>
              {t('createdOnLabel', {
                date: meta.createdAt ? new Date(meta.createdAt).toLocaleDateString(locale) : '—',
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('phoneNumbersLabel')}</span>
            <button type="button" onClick={addPhone} className="text-xs underline">
              {t('addPhoneButton')}
            </button>
          </div>
          {values.phones.map((row, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={row.type_id}
                onChange={(event) => updatePhone(index, { type_id: event.target.value })}
                className="rounded border border-input-border bg-input-background px-2 py-1"
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
                className="flex-1 rounded border border-input-border bg-input-background px-3 py-1"
              />
              <button type="button" onClick={() => removePhone(index)} className="text-xs text-danger">
                {t('removeButton')}
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t('emailsLabel')}</span>
            <button type="button" onClick={addEmail} className="text-xs underline">
              {t('addEmailButton')}
            </button>
          </div>
          {values.emails.map((row, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={row.type_id}
                onChange={(event) => updateEmail(index, { type_id: event.target.value })}
                className="rounded border border-input-border bg-input-background px-2 py-1"
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
                className="flex-1 rounded border border-input-border bg-input-background px-3 py-1"
              />
              <button type="button" onClick={() => removeEmail(index)} className="text-xs text-danger">
                {t('removeButton')}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-6">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
          <span className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('contactTypeHeading')}
          </span>
          {selectedTypes.map((type) => {
            const colors = contactTypeColors(type.name)
            const isActive = type.id === effectiveActiveTypeId
            return (
              <button
                type="button"
                key={type.id}
                onClick={() => setActiveTypeId(type.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${colors.bg} ${colors.text} ${
                  isActive ? 'ring-2 ring-current' : ''
                }`}
              >
                {type.name}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setShowTypesEditor((prev) => !prev)}
            className="rounded border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground hover:bg-muted/50"
          >
            {showTypesEditor ? t('doneButton') : t('addEditContactTypesButton')}
          </button>
          {showTypesEditor && (
            <fieldset className="flex flex-col gap-2 rounded border border-border p-3 text-sm">
              <legend className="px-1 text-xs font-medium text-muted-foreground">{t('contactTypesLegend')}</legend>
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
            </fieldset>
          )}
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-border bg-muted/30 p-3">
          <span className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('sectionHeading')}</span>
          {activeType ? (
            subNavItems.map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={() => setActiveSubNavKey(item.key)}
                className={`rounded px-3 py-2 text-left text-sm ${
                  item.key === effectiveSubNavKey
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </button>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">{t('addContactTypeToSeeOptions')}</p>
          )}
        </div>

        <div className="rounded-lg border-2 border-border bg-background p-4 shadow-sm">{renderDetailPanel()}</div>

        <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-3">
          <label className="field-label">
            {t('notesLabel')}
            <textarea
              value={values.notes}
              onChange={(event) => setValues((prev) => ({ ...prev, notes: event.target.value }))}
              rows={4}
              className="rounded border border-input-border bg-input-background px-3 py-2"
            />
          </label>

          {mode === 'edit' && (
            <div className="flex flex-col gap-2 text-xs text-muted-foreground">
              <div>
                {t('lastUpdatedLabel', { date: meta.updatedAt ? new Date(meta.updatedAt).toLocaleString(locale) : '—' })}
              </div>
              <div className="flex items-center gap-2">
                <span>
                  {t('lastContactedLabel', {
                    date: values.last_contacted_at
                      ? new Date(values.last_contacted_at).toLocaleDateString(locale)
                      : t('neverLabel'),
                  })}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setValues((prev) => ({ ...prev, last_contacted_at: new Date().toISOString() }))
                  }
                  className="rounded border border-input-border px-2 py-1 text-xs text-foreground hover:bg-muted/50"
                >
                  {t('updateToTodayButton')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
      >
        {submitting ? t('savingButton') : mode === 'create' ? t('createContactButton') : t('saveChangesButton')}
      </button>
    </form>
  )
}
