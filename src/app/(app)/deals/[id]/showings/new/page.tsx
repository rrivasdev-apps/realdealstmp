import { filterContactsByType } from '@/lib/contacts/by-type'
import { createClient } from '@/lib/supabase/server'

import { ShowingForm } from '../../../showing-form'

export default async function NewShowingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const supabase = await createClient()

  const [{ data: showingStatuses }, { data: contacts }] = await Promise.all([
    supabase.from('showing_statuses').select('id, name').order('sort_order'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
  ])

  const buyerContacts = filterContactsByType(contacts ?? [], 'Investor')
  const vendorContacts = filterContactsByType(contacts ?? [], 'Vendor')

  return (
    <div>
      <h1 className="text-xl font-semibold">New showing</h1>
      <div className="mt-6">
        <ShowingForm
          mode="create"
          initialValues={{
            dealId,
            showing_date: '',
            status_id: showingStatuses?.[0]?.id ?? '',
            buyer_contact_id: '',
            vendor_contact_id: '',
            details: '',
          }}
          showingStatuses={showingStatuses ?? []}
          buyerContacts={buyerContacts}
          vendorContacts={vendorContacts}
        />
      </div>
    </div>
  )
}
