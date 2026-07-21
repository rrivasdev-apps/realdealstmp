import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('company_id').eq('id', dealId).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  const { data: scheduledStatus } = await supabase
    .from('showing_statuses')
    .select('id')
    .eq('name', 'Scheduled')
    .single()

  if (!scheduledStatus) {
    return NextResponse.json({ error: 'Showing statuses are not set up.' }, { status: 500 })
  }

  const { data: showing, error } = await supabase
    .from('showings')
    .insert({
      deal_id: dealId,
      showing_date: body.showing_date || null,
      status_id: body.status_id || scheduledStatus.id,
      buyer_contact_id: body.buyer_contact_id || null,
      vendor_contact_id: body.vendor_contact_id || null,
      details: body.details || null,
    })
    .select('id')
    .single()

  if (error || !showing) {
    return NextResponse.json({ error: error?.message ?? 'Could not create showing.' }, { status: 400 })
  }

  return NextResponse.json({ id: showing.id })
}
