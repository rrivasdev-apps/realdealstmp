import { NextResponse } from 'next/server'

import { evaluateTriggersForDealUpdated } from '@/lib/automations/runtime'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id: dealId, expenseId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: deal }, { data: existing }] = await Promise.all([
    supabase.from('deals').select('company_id, total_expenses').eq('id', dealId).single(),
    supabase.from('deal_expenses').select('deal_id').eq('id', expenseId).single(),
  ])
  if (!deal || deal.company_id !== profile.company_id || !existing || existing.deal_id !== dealId) {
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

  const { error } = await supabase
    .from('deal_expenses')
    .update({
      category_id: categoryId,
      amount,
      description: body.description || null,
      expense_date: body.expense_date || null,
    })
    .eq('id', expenseId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: updatedDeal } = await supabase.from('deals').select('total_expenses').eq('id', dealId).single()
  await evaluateTriggersForDealUpdated(
    supabase,
    profile.company_id,
    dealId,
    { total_expenses: deal.total_expenses },
    { total_expenses: updatedDeal?.total_expenses ?? null }
  )

  return NextResponse.json({ id: expenseId, total_expenses: updatedDeal?.total_expenses ?? null })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  const { id: dealId, expenseId } = await params
  const profile = await requirePermission('edit_deal_detail')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const [{ data: deal }, { data: existing }] = await Promise.all([
    supabase.from('deals').select('company_id, total_expenses').eq('id', dealId).single(),
    supabase.from('deal_expenses').select('deal_id').eq('id', expenseId).single(),
  ])
  if (!deal || deal.company_id !== profile.company_id || !existing || existing.deal_id !== dealId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase.from('deal_expenses').delete().eq('id', expenseId)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data: updatedDeal } = await supabase.from('deals').select('total_expenses').eq('id', dealId).single()
  await evaluateTriggersForDealUpdated(
    supabase,
    profile.company_id,
    dealId,
    { total_expenses: deal.total_expenses },
    { total_expenses: updatedDeal?.total_expenses ?? null }
  )

  return NextResponse.json({ ok: true, total_expenses: updatedDeal?.total_expenses ?? null })
}
