import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: partnerCompany } = await supabase.from('partner_companies').select('company_id').eq('id', id).single()
  if (!partnerCompany || partnerCompany.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()

  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('partner_companies')
      .update({
        name,
        address: typeof body.address === 'string' ? body.address.trim() || null : null,
        email: typeof body.email === 'string' ? body.email.trim() || null : null,
        phone: typeof body.phone === 'string' ? body.phone.trim() || null : null,
      })
      .eq('id', id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
  }

  if (Array.isArray(body.company_type_ids)) {
    const companyTypeIds: string[] = body.company_type_ids

    const { data: validTypes } = await supabase
      .from('company_types')
      .select('id')
      .in('id', companyTypeIds.length ? companyTypeIds : ['00000000-0000-0000-0000-000000000000'])
    const validIds = (validTypes ?? []).map((row) => row.id)

    const { error: deleteError } = await supabase.from('partner_company_types').delete().eq('partner_company_id', id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    if (validIds.length) {
      const { error: insertError } = await supabase
        .from('partner_company_types')
        .insert(validIds.map((company_type_id) => ({ partner_company_id: id, company_type_id })))
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 400 })
      }
    }
  }

  return NextResponse.json({ id })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: partnerCompany } = await supabase.from('partner_companies').select('company_id').eq('id', id).single()
  if (!partnerCompany || partnerCompany.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { error } = await supabase.from('partner_companies').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
