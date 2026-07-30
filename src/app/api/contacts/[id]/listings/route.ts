import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: contactId } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: contact } = await supabase.from('contacts').select('company_id').eq('id', contactId).single()
  if (!contact || contact.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('realtor_listings')
    .insert({
      contact_id: contactId,
      address,
      list_price: body.list_price ?? null,
      status_id: body.status_id || null,
      listing_date: body.listing_date || null,
      notes: body.notes || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create listing.' }, { status: 400 })
  }

  return NextResponse.json({ id: data.id })
}
