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
  const checklistItemId = typeof body.checklist_item_id === 'string' ? body.checklist_item_id : ''
  if (!checklistItemId) {
    return NextResponse.json({ error: 'checklist_item_id is required.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('deal_checklist_items')
    .insert({ deal_id: dealId, checklist_item_id: checklistItemId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
