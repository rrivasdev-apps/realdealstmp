'use client'

import Link from 'next/link'

type LookupOption = { id: string; name: string }
type ContactPartnerCompany = { contact_id: string; partner_company_id: string }

// Shared by every deal/offer slot that pairs a contact with an optional
// company (JV partner, title company, mortgage company, realtor, investor):
// the company dropdown only ever shows companies linked to the selected
// contact (via contact_partner_companies), matching how the Contact Hub
// models "contact is primary, company is an optional linked attribute" --
// see CLAUDE.md's Phase 2.5 spec.
export function ContactCompanyField({
  contactLabel,
  companyLabel,
  contacts,
  companies,
  contactPartnerCompanies,
  contactId,
  companyId,
  onContactChange,
  onCompanyChange,
}: {
  contactLabel: string
  companyLabel: string
  contacts: LookupOption[]
  companies: LookupOption[]
  contactPartnerCompanies: ContactPartnerCompany[]
  contactId: string
  companyId: string
  onContactChange: (contactId: string, companyId: string) => void
  onCompanyChange: (companyId: string) => void
}) {
  const linkedCompanyIds = new Set(
    contactPartnerCompanies.filter((row) => row.contact_id === contactId).map((row) => row.partner_company_id)
  )
  const filteredCompanies = companies.filter((option) => linkedCompanyIds.has(option.id))
  const hasNoLinkedCompanies = Boolean(contactId) && linkedCompanyIds.size === 0

  return (
    <>
      <label className="field-label">
        {contactLabel}
        <select
          value={contactId}
          onChange={(event) => {
            const newContactId = event.target.value
            const newLinkedIds = new Set(
              contactPartnerCompanies
                .filter((row) => row.contact_id === newContactId)
                .map((row) => row.partner_company_id)
            )
            onContactChange(newContactId, newLinkedIds.has(companyId) ? companyId : '')
          }}
          className="rounded border border-input-border bg-input-background px-3 py-2"
        >
          <option value="">—</option>
          {contacts.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-label">
        {companyLabel}
        <select
          value={companyId}
          onChange={(event) => onCompanyChange(event.target.value)}
          disabled={!contactId}
          className="rounded border border-input-border bg-input-background px-3 py-2 disabled:opacity-50"
        >
          <option value="">—</option>
          {filteredCompanies.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {hasNoLinkedCompanies && (
          <span className="text-xs text-muted-foreground">
            This contact has no linked companies yet — link one from their{' '}
            <Link href={`/contacts/${contactId}`} target="_blank" className="underline">
              contact page
            </Link>
            .
          </span>
        )}
      </label>
    </>
  )
}
