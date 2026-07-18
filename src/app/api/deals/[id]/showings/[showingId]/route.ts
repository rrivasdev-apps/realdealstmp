import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; showingId: string }> }
) {
  const { id: dealId, showingId } = await params
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: deal }, { data: existing }] = await Promise.all([
    supabase.from('deals').select('company_id').eq('id', dealId).single(),
    supabase.from('showings').select('deal_id').eq('id', showingId).single(),
  ])
  if (!deal || deal.company_id !== profile.company_id || !existing || existing.deal_id !== dealId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  const { error } = await supabase
    .from('showings')
    .update({
      showing_date: body.showing_date || null,
      status_id: body.status_id || undefined,
      buyer_contact_id: body.buyer_contact_id || null,
      vendor_contact_id: body.vendor_contact_id || null,
      details: body.details || null,
    })
    .eq('id', showingId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ id: showingId })
}
