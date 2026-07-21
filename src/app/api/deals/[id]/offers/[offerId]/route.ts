import { NextResponse } from 'next/server'

import { applyAcceptedOfferToDeal } from '@/lib/deals/offers'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; offerId: string }> }
) {
  const { id: dealId, offerId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: deal }, { data: existing }] = await Promise.all([
    supabase.from('deals').select('company_id').eq('id', dealId).single(),
    supabase.from('offers').select('deal_id').eq('id', offerId).single(),
  ])
  if (!deal || deal.company_id !== profile.company_id || !existing || existing.deal_id !== dealId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  const { error } = await supabase
    .from('offers')
    .update({
      offer_price: body.offer_price ?? null,
      offer_date: body.offer_date || null,
      status_id: body.status_id || undefined,
      inspection_deadline: body.inspection_deadline || null,
      closing_deadline: body.closing_deadline || null,
      emd_deadline: body.emd_deadline || null,
      purchase_type_id: body.purchase_type_id || null,
      realtor_contact_id: body.realtor_contact_id || null,
      investor_contact_id: body.investor_contact_id || null,
      notes: body.notes || null,
    })
    .eq('id', offerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Accepting an offer -- whether at creation or later here via PATCH --
  // carries its price onto the deal's BC contract (see applyAcceptedOfferToDeal).
  if (body.status_id) {
    const { data: acceptedStatus } = await supabase
      .from('offer_statuses')
      .select('id')
      .eq('name', 'Accepted')
      .single()
    if (acceptedStatus && body.status_id === acceptedStatus.id) {
      await applyAcceptedOfferToDeal(supabase, dealId, body.offer_price ?? null)
    }
  }

  return NextResponse.json({ id: offerId })
}
