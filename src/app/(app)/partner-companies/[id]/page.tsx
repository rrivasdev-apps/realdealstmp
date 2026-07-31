import Link from 'next/link'
import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { PartnerCompanyDeleteButton } from '../partner-company-delete-button'
import { PartnerCompanyForm } from '../partner-company-form'

export default async function EditPartnerCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">Company</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this company.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: partnerCompany }, { data: companyTypes }, { data: linkedContactRows }] = await Promise.all([
    supabase
      .from('partner_companies')
      .select('id, name, address, email, phone, partner_company_types(company_type_id)')
      .eq('id', id)
      .single(),
    supabase.from('company_types').select('id, name').order('name'),
    supabase
      .from('contact_partner_companies')
      .select('contacts(id, name)')
      .eq('partner_company_id', id),
  ])

  if (!partnerCompany) {
    notFound()
  }

  const canEdit = profile.role === 'admin' || profile.permissions?.edit_contacts

  const linkedContacts = (linkedContactRows ?? [])
    .map((row) => row.contacts)
    .filter((contact): contact is { id: string; name: string } => contact != null)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <h1 className="heading-page">Edit company</h1>
      <div className="mt-6">
        <PartnerCompanyForm
          mode="edit"
          initialValues={{
            id: partnerCompany.id,
            name: partnerCompany.name,
            address: partnerCompany.address ?? '',
            email: partnerCompany.email ?? '',
            phone: partnerCompany.phone ?? '',
            companyTypeIds: partnerCompany.partner_company_types.map((row) => row.company_type_id),
          }}
          companyTypes={companyTypes ?? []}
        />
      </div>

      <div className="mt-6 flex max-w-xl flex-col gap-2 text-sm">
        <span className="font-medium">Points of Contact</span>
        {linkedContacts.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No contacts linked yet — link this company from a contact&apos;s Company panel.
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {linkedContacts.map((contact) => (
              <li key={contact.id} className="rounded border border-border px-2 py-1.5">
                <Link href={`/contacts/${contact.id}`} className="hover:underline">
                  {contact.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <div className="mt-6">
          <PartnerCompanyDeleteButton partnerCompanyId={partnerCompany.id} />
        </div>
      )}
    </div>
  )
}
