import { NextResponse } from 'next/server'

import { applyAcceptedOfferToDeal } from '@/lib/deals/offers'
import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('company_id').eq('id', dealId).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  const [{ data: pendingStatus }, { data: acceptedStatus }] = await Promise.all([
    supabase.from('offer_statuses').select('id').eq('name', 'Pending').single(),
    supabase.from('offer_statuses').select('id').eq('name', 'Accepted').single(),
  ])

  if (!pendingStatus) {
    return NextResponse.json({ error: 'Offer statuses are not set up.' }, { status: 500 })
  }

  const statusId = body.status_id || pendingStatus.id

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      deal_id: dealId,
      offer_price: body.offer_price ?? null,
      offer_date: body.offer_date || null,
      status_id: statusId,
      inspection_deadline: body.inspection_deadline || null,
      closing_deadline: body.closing_deadline || null,
      emd_deadline: body.emd_deadline || null,
      purchase_type_id: body.purchase_type_id || null,
      realtor_contact_id: body.realtor_contact_id || null,
      investor_contact_id: body.investor_contact_id || null,
      notes: body.notes || null,
    })
    .select('id')
    .single()

  if (error || !offer) {
    return NextResponse.json({ error: error?.message ?? 'Could not create offer.' }, { status: 400 })
  }

  // Accepting an offer -- whether at creation or later via PATCH -- carries
  // its price onto the deal's BC contract (see applyAcceptedOfferToDeal).
  if (acceptedStatus && statusId === acceptedStatus.id) {
    await applyAcceptedOfferToDeal(supabase, dealId, body.offer_price ?? null)
  }

  return NextResponse.json({ id: offer.id })
}
