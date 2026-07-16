import { createClient } from '@/lib/supabase/server'

import { ContactForm } from '../contact-form'

export default async function NewContactPage() {
  const supabase = await createClient()
  const [{ data: contactTypes }, { data: phoneTypes }, { data: emailTypes }] = await Promise.all([
    supabase.from('contact_types').select('id, name').order('name'),
    supabase.from('phone_types').select('id, name').order('name'),
    supabase.from('email_types').select('id, name').order('name'),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold">New contact</h1>
      <div className="mt-6">
        <ContactForm
          mode="create"
          initialValues={{ name: '', notes: '', contactTypeIds: [], phones: [], emails: [] }}
          contactTypes={contactTypes ?? []}
          phoneTypes={phoneTypes ?? []}
          emailTypes={emailTypes ?? []}
        />
      </div>
    </div>
  )
}
