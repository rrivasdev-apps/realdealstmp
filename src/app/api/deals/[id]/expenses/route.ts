import { NextResponse } from 'next/server'

import { evaluateTriggersForDealUpdated } from '@/lib/automations/runtime'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: dealId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: deal } = await supabase.from('deals').select('company_id, total_expenses').eq('id', dealId).single()
  if (!deal || deal.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const categoryId = typeof body.category_id === 'string' ? body.category_id : ''
  const amount = Number(body.amount)
  if (!categoryId) {
    return NextResponse.json({ error: 'Category is required.' }, { status: 400 })
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Amount must be a positive number.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('deal_expenses')
    .insert({
      deal_id: dealId,
      category_id: categoryId,
      amount,
      description: body.description || null,
      expense_date: body.expense_date || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not add expense.' }, { status: 400 })
  }

  // total_expenses is kept in sync by the deal_expenses_sync_total DB
  // trigger, not this route -- re-fetch so field_changed automations on
  // "Total expenses" still fire the same way they did when it was a
  // manually-edited field (see /api/deals/[id]'s PATCH route).
  const { data: updatedDeal } = await supabase.from('deals').select('total_expenses').eq('id', dealId).single()
  await evaluateTriggersForDealUpdated(
    supabase,
    profile.company_id,
    dealId,
    { total_expenses: deal.total_expenses },
    { total_expenses: updatedDeal?.total_expenses ?? null }
  )

  return NextResponse.json({ id: data.id, total_expenses: updatedDeal?.total_expenses ?? null })
}
