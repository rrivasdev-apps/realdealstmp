import { notFound } from 'next/navigation'

import { filterContactsByType } from '@/lib/contacts/by-type'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ShowingForm } from '../../../showing-form'

export default async function EditShowingPage({
  params,
}: {
  params: Promise<{ id: string; showingId: string }>
}) {
  const { id: dealId, showingId } = await params

  const profile = await requirePermission('edit_deal_detail')
  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Showing</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to edit this deal.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: showing }, { data: showingStatuses }, { data: contacts }] = await Promise.all([
    supabase.from('showings').select('*').eq('id', showingId).single(),
    supabase.from('showing_statuses').select('id, name').order('sort_order'),
    supabase.from('contacts').select('id, name, contact_contact_types(contact_types(name))').order('name'),
  ])

  if (!showing || showing.deal_id !== dealId) {
    notFound()
  }

  const buyerContacts = filterContactsByType(contacts ?? [], 'Investor')
  const vendorContacts = filterContactsByType(contacts ?? [], 'Vendor')

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit showing</h1>
      <div className="mt-6">
        <ShowingForm
          mode="edit"
          initialValues={{
            id: showing.id,
            dealId,
            showing_date: showing.showing_date ?? '',
            status_id: showing.status_id ?? '',
            buyer_contact_id: showing.buyer_contact_id ?? '',
            vendor_contact_id: showing.vendor_contact_id ?? '',
            details: showing.details ?? '',
          }}
          showingStatuses={showingStatuses ?? []}
          buyerContacts={buyerContacts}
          vendorContacts={vendorContacts}
        />
      </div>
    </div>
  )
}
