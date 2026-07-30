import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  const { id: contactId, listingId } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: contact }, { data: existing }] = await Promise.all([
    supabase.from('contacts').select('company_id').eq('id', contactId).single(),
    supabase.from('realtor_listings').select('contact_id').eq('id', listingId).single(),
  ])
  if (!contact || contact.company_id !== profile.company_id || !existing || existing.contact_id !== contactId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('realtor_listings')
    .update({
      address,
      list_price: body.list_price ?? null,
      status_id: body.status_id || null,
      listing_date: body.listing_date || null,
      notes: body.notes || null,
    })
    .eq('id', listingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id: listingId })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; listingId: string }> }
) {
  const { id: contactId, listingId } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: contact }, { data: existing }] = await Promise.all([
    supabase.from('contacts').select('company_id').eq('id', contactId).single(),
    supabase.from('realtor_listings').select('contact_id').eq('id', listingId).single(),
  ])
  if (!contact || contact.company_id !== profile.company_id || !existing || existing.contact_id !== contactId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase.from('realtor_listings').delete().eq('id', listingId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
