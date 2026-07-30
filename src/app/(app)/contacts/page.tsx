import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ContactsList } from './contacts-list'

export default async function ContactsPage() {
  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">Contacts</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view contacts.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: contacts }, { data: contactTypes }] = await Promise.all([
    supabase
      .from('contacts')
      .select(
        `id, name, notes,
         contact_contact_types(contact_type_id, contact_types(name)),
         contact_phone_numbers(phone),
         contact_emails(email)`
      )
      .order('name'),
    supabase.from('contact_types').select('id, name').order('name'),
  ])

  const shapedContacts = (contacts ?? []).map((contact) => ({
    id: contact.id,
    name: contact.name,
    notes: contact.notes,
    typeIds: contact.contact_contact_types.map((row) => row.contact_type_id),
    typeNames: contact.contact_contact_types.map((row) => row.contact_types?.name).filter((name): name is string => Boolean(name)),
    phones: contact.contact_phone_numbers.map((row) => row.phone),
    emails: contact.contact_emails.map((row) => row.email),
  }))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-page">Contacts</h1>
        <Link href="/contacts/new" className="rounded bg-foreground px-4 py-2 text-sm text-background">
          New contact
        </Link>
      </div>

      <ContactsList contacts={shapedContacts} contactTypes={contactTypes ?? []} />
    </div>
  )
}
