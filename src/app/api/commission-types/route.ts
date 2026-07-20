import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const admin = await requirePermission('can_manage_settings')
  if (!admin || !admin.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const category = body.category === 'flat' || body.category === 'percentage' ? body.category : ''
  const basis =
    body.basis === 'contract_price' || body.basis === 'gross_profit' || body.basis === 'current_selling_price'
      ? body.basis
      : null
  const value = typeof body.value === 'number' ? body.value : Number(body.value)

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  if (!category) {
    return NextResponse.json({ error: 'Category must be flat or percentage.' }, { status: 400 })
  }
  if (category === 'percentage' && !basis) {
    return NextResponse.json({ error: 'Basis is required for percentage commission types.' }, { status: 400 })
  }
  if (category === 'flat' && basis) {
    return NextResponse.json({ error: 'Basis does not apply to flat commission types.' }, { status: 400 })
  }
  if (!Number.isFinite(value)) {
    return NextResponse.json({ error: 'Value is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commission_types')
    .insert({
      company_id: admin.company_id,
      name,
      description: body.description || null,
      category,
      basis: category === 'percentage' ? basis : null,
      value,
    })
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create commission type.' }, { status: 400 })
  }

  return NextResponse.json(data)
}
