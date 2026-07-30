import { filterContactsByType } from '@/lib/contacts/by-type'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { OfferForm } from '../../../offer-form'

export default async function NewOfferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params

  const profile = await requirePermission('edit_deal_detail')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">New offer</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to edit this deal.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: offerStatuses }, { data: purchaseTypes }, { data: contacts }, { data: partnerCompanies }, { data: contactPartnerCompanies }] =
    await Promise.all([
      supabase.from('offer_statuses').select('id, name').order('sort_order'),
      supabase.from('purchase_types').select('id, name').order('name'),
      supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
      supabase.from('partner_companies').select('id, name').order('name'),
      supabase.from('contact_partner_companies').select('contact_id, partner_company_id'),
    ])

  const realtorContacts = filterContactsByType(contacts ?? [], 'Realtor')
  const investorContacts = filterContactsByType(contacts ?? [], 'Investor')

  return (
    <div>
      <h1 className="heading-page">New offer</h1>
      <div className="mt-6">
        <OfferForm
          mode="create"
          initialValues={{
            dealId,
            offer_price: '',
            offer_date: '',
            status_id: offerStatuses?.[0]?.id ?? '',
            inspection_deadline: '',
            closing_deadline: '',
            emd_deadline: '',
            purchase_type_id: '',
            realtor_contact_id: '',
            realtor_company_id: '',
            investor_contact_id: '',
            investor_company_id: '',
            notes: '',
          }}
          offerStatuses={offerStatuses ?? []}
          purchaseTypes={purchaseTypes ?? []}
          realtorContacts={realtorContacts}
          investorContacts={investorContacts}
          partnerCompanies={partnerCompanies ?? []}
          contactPartnerCompanies={contactPartnerCompanies ?? []}
        />
      </div>
    </div>
  )
}
