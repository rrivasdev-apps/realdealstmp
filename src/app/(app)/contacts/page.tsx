import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ContactsPage() {
  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Contacts</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view contacts.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: contacts } = await supabase
    .from('contacts')
    .select(
      `id, name, notes,
       contact_contact_types(contact_types(name)),
       contact_phone_numbers(phone),
       contact_emails(email)`
    )
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <Link href="/contacts/new" className="rounded bg-foreground px-4 py-2 text-sm text-background">
          New contact
        </Link>
      </div>

      <ul className="mt-6 divide-y divide-border">
        {contacts?.map((contact) => {
          const types = contact.contact_contact_types
            .map((row) => row.contact_types?.name)
            .filter(Boolean)
            .join(', ')
          const phone = contact.contact_phone_numbers[0]?.phone
          const email = contact.contact_emails[0]?.email

          return (
            <li key={contact.id} className="py-3">
              <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
                {contact.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {[types, phone, email].filter(Boolean).join(' · ') || 'No details yet'}
              </div>
            </li>
          )
        })}
        {contacts?.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">No contacts yet.</li>
        )}
      </ul>
    </div>
  )
}
