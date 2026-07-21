import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type PhoneInput = { type_id: string; phone: string }
type EmailInput = { type_id: string; email: string }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('edit_contacts')
  if (!profile || !profile.company_id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('contacts').select('company_id').eq('id', id).single()
  if (!existing || existing.company_id !== profile.company_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
  }

  const contactTypeIds: string[] = Array.isArray(body.contactTypeIds) ? body.contactTypeIds : []
  const phones: PhoneInput[] = Array.isArray(body.phones) ? body.phones : []
  const emails: EmailInput[] = Array.isArray(body.emails) ? body.emails : []

  const { error } = await supabase.from('contacts').update({ name, notes: body.notes || null }).eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  await Promise.all([
    supabase.from('contact_contact_types').delete().eq('contact_id', id),
    supabase.from('contact_phone_numbers').delete().eq('contact_id', id),
    supabase.from('contact_emails').delete().eq('contact_id', id),
  ])

  await Promise.all([
    contactTypeIds.length
      ? supabase
          .from('contact_contact_types')
          .insert(contactTypeIds.map((contact_type_id) => ({ contact_id: id, contact_type_id })))
      : Promise.resolve(),
    phones.length
      ? supabase
          .from('contact_phone_numbers')
          .insert(phones.map((row) => ({ contact_id: id, type_id: row.type_id, phone: row.phone })))
      : Promise.resolve(),
    emails.length
      ? supabase
          .from('contact_emails')
          .insert(emails.map((row) => ({ contact_id: id, type_id: row.type_id, email: row.email })))
      : Promise.resolve(),
  ])

  return NextResponse.json({ id })
}
