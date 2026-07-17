import { notFound } from 'next/navigation'

import { filterContactsByType } from '@/lib/contacts/by-type'
import { createClient } from '@/lib/supabase/server'

import { OfferForm } from '../../../offer-form'

export default async function EditOfferPage({
  params,
}: {
  params: Promise<{ id: string; offerId: string }>
}) {
  const { id: dealId, offerId } = await params
  const supabase = await createClient()

  const [{ data: offer }, { data: offerStatuses }, { data: purchaseTypes }, { data: contacts }] =
    await Promise.all([
      supabase.from('offers').select('*').eq('id', offerId).single(),
      supabase.from('offer_statuses').select('id, name').order('sort_order'),
      supabase.from('purchase_types').select('id, name').order('name'),
      supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
    ])

  if (!offer || offer.deal_id !== dealId) {
    notFound()
  }

  const realtorContacts = filterContactsByType(contacts ?? [], 'Realtor')
  const investorContacts = filterContactsByType(contacts ?? [], 'Investor')

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit offer</h1>
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
            investor_contact_id: offer.investor_contact_id ?? '',
            notes: offer.notes ?? '',
          }}
          offerStatuses={offerStatuses ?? []}
          purchaseTypes={purchaseTypes ?? []}
          realtorContacts={realtorContacts}
          investorContacts={investorContacts}
        />
      </div>
    </div>
  )
}
