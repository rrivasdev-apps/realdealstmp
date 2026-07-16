import { NextResponse } from 'next/server'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const profile = await requireProfile()
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const address = typeof body.address === 'string' ? body.address.trim() : ''
  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: forSaleStatus } = await supabase
    .from('deal_statuses')
    .select('id')
    .eq('name', 'For Sale')
    .single()

  if (!forSaleStatus) {
    return NextResponse.json({ error: 'Deal statuses are not set up.' }, { status: 500 })
  }

  // original_* is set once here, from the same values the client submitted
  // for the current fields -- never touched again after this insert (see
  // the protect_original_deal_values trigger).
  const { data: deal, error } = await supabase
    .from('deals')
    .insert({
      company_id: profile.company_id,
      address,
      market_id: body.market_id || null,
      property_type_id: body.property_type_id || null,
      deal_type_id: body.deal_type_id || null,
      lead_source_id: body.lead_source_id || null,
      status_id: forSaleStatus.id,
      contract_price: body.contract_price ?? null,
      original_contract_price: body.contract_price ?? null,
      contract_date: body.contract_date || null,
      closing_date: body.closing_date || null,
      original_closing_date: body.closing_date || null,
      due_diligence_expiration: body.due_diligence_expiration || null,
      original_due_diligence_date: body.due_diligence_expiration || null,
      projected_sales_price: body.projected_sales_price ?? null,
      original_projected_sales_price: body.projected_sales_price ?? null,
    })
    .select('id')
    .single()

  if (error || !deal) {
    return NextResponse.json({ error: error?.message ?? 'Could not create deal.' }, { status: 400 })
  }

  return NextResponse.json({ id: deal.id })
}
