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
        <h1 className="text-xl font-semibold">New offer</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to edit this deal.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: offerStatuses }, { data: purchaseTypes }, { data: contacts }] = await Promise.all([
    supabase.from('offer_statuses').select('id, name').order('sort_order'),
    supabase.from('purchase_types').select('id, name').order('name'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
  ])

  const realtorContacts = filterContactsByType(contacts ?? [], 'Realtor')
  const investorContacts = filterContactsByType(contacts ?? [], 'Investor')

  return (
    <div>
      <h1 className="text-xl font-semibold">New offer</h1>
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
            investor_contact_id: '',
            notes: '',
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
