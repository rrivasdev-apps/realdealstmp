import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }
  const address = typeof body.address === 'string' ? body.address.trim() || null : null
  const email = typeof body.email === 'string' ? body.email.trim() || null : null
  const phone = typeof body.phone === 'string' ? body.phone.trim() || null : null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('partner_companies')
    .insert({ company_id: profile.company_id, name, address, email, phone })
    .select('id, name')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Could not create company.' }, { status: 400 })
  }

  if (Array.isArray(body.company_type_ids) && body.company_type_ids.length > 0) {
    const companyTypeIds: string[] = body.company_type_ids

    const { data: validTypes } = await supabase.from('company_types').select('id').in('id', companyTypeIds)
    const validIds = (validTypes ?? []).map((row) => row.id)

    if (validIds.length) {
      const { error: typesError } = await supabase
        .from('partner_company_types')
        .insert(validIds.map((company_type_id) => ({ partner_company_id: data.id, company_type_id })))
      if (typesError) {
        return NextResponse.json({ error: typesError.message }, { status: 400 })
      }
    }
  }

  return NextResponse.json(data)
}
