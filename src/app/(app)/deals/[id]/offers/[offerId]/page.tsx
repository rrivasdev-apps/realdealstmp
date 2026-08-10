import { getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'

import { filterContactsByType } from '@/lib/contacts/by-type'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { OfferForm } from '../../../offer-form'

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>
}) {
  const { id: dealId, offerId } = await params
  const t = await getTranslations('DealDetail')

  const profile = await requirePermission('edit_deal_detail')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('offerFallbackTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noEditPermission')}</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [
    { data: offer },
    { data: offerStatuses },
    { data: purchaseTypes },
    { data: contacts },
    { data: partnerCompanies },
    { data: contactPartnerCompanies },
  ] = await Promise.all([
    supabase.from('offers').select('*').eq('id', offerId).single(),
    supabase.from('offer_statuses').select('id, name').order('sort_order'),
    supabase.from('purchase_types').select('id, name').order('name'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
    supabase.from('partner_companies').select('id, name').order('name'),
    supabase.from('contact_partner_companies').select('contact_id, partner_company_id'),
  ])

  if (!offer || offer.deal_id !== dealId) {
    notFound()
  }

  const realtorContacts = filterContactsByType(contacts ?? [], 'Realtor')
  const investorContacts = filterContactsByType(contacts ?? [], 'Investor')

  return (
    <div>
      <h1 className="heading-page">{t('editOfferTitle')}</h1>
      <div className="mt-6">
        <OfferForm
          mode="edit"
          initialValues={{
            id: offer.id,
            dealId,
            offer_price: offer.offer_price?.toString() ?? '',
            offer_date: offer.offer_date ?? '',
            status_id: offer.status_id ?? '',
            inspection_deadline: offer.inspection_deadline ?? '',
            closing_deadline: offer.closing_deadline ?? '',
            emd_deadline: offer.emd_deadline ?? '',
            purchase_type_id: offer.purchase_type_id ?? '',
            realtor_contact_id: offer.realtor_contact_id ?? '',
            realtor_company_id: offer.realtor_company_id ?? '',
            investor_contact_id: offer.investor_contact_id ?? '',
            investor_company_id: offer.investor_company_id ?? '',
            notes: offer.notes ?? '',
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
