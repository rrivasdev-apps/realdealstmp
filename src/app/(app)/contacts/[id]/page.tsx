import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { ContactForm } from '../contact-form'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: contact }, { data: contactTypes }, { data: phoneTypes }, { data: emailTypes }] =
    await Promise.all([
      supabase
        .from('contacts')
        .select(
          `id, name, notes,
           contact_contact_types(contact_type_id),
           contact_phone_numbers(type_id, phone),
           contact_emails(type_id, email)`
        )
        .eq('id', id)
        .single(),
      supabase.from('contact_types').select('id, name').order('name'),
      supabase.from('phone_types').select('id, name').order('name'),
      supabase.from('email_types').select('id, name').order('name'),
    ])

  if (!contact) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit contact</h1>
      <div className="mt-6">
        <ContactForm
          mode="edit"
          initialValues={{
            id: contact.id,
            name: contact.name,
            notes: contact.notes ?? '',
            contactTypeIds: contact.contact_contact_types.map((row) => row.contact_type_id),
            phones: contact.contact_phone_numbers.map((row) => ({ type_id: row.type_id ?? '', phone: row.phone })),
            emails: contact.contact_emails.map((row) => ({ type_id: row.type_id ?? '', email: row.email })),
          }}
          contactTypes={contactTypes ?? []}
          phoneTypes={phoneTypes ?? []}
          emailTypes={emailTypes ?? []}
        />
      </div>
    </div>
  )
}
