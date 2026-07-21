import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

type PhoneInput = { type_id: string; phone: string }
type EmailInput = { type_id: string; email: string }

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

  const contactTypeIds: string[] = Array.isArray(body.contactTypeIds) ? body.contactTypeIds : []
  const phones: PhoneInput[] = Array.isArray(body.phones) ? body.phones : []
  const emails: EmailInput[] = Array.isArray(body.emails) ? body.emails : []

  const supabase = await createClient()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ company_id: profile.company_id, name, notes: body.notes || null })
    .select('id')
    .single()

  if (error || !contact) {
    return NextResponse.json({ error: error?.message ?? 'Could not create contact.' }, { status: 400 })
  }

  await Promise.all([
    contactTypeIds.length
      ? supabase
          .from('contact_contact_types')
          .insert(contactTypeIds.map((contact_type_id) => ({ contact_id: contact.id, contact_type_id })))
      : Promise.resolve(),
    phones.length
      ? supabase
          .from('contact_phone_numbers')
          .insert(phones.map((row) => ({ contact_id: contact.id, type_id: row.type_id, phone: row.phone })))
      : Promise.resolve(),
    emails.length
      ? supabase
          .from('contact_emails')
          .insert(emails.map((row) => ({ contact_id: contact.id, type_id: row.type_id, email: row.email })))
      : Promise.resolve(),
  ])

  return NextResponse.json({ id: contact.id })
}
