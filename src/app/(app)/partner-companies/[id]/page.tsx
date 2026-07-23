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
        <h1 className="text-xl font-semibold">Company</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view this company.</p>
      </div>
    )
  }

  const supabase = await createClient()

  const [{ data: partnerCompany }, { data: companyTypes }] = await Promise.all([
    supabase
      .from('partner_companies')
      .select('id, name, address, email, phone, partner_company_types(company_type_id)')
      .eq('id', id)
      .single(),
    supabase.from('company_types').select('id, name').order('name'),
  ])

  if (!partnerCompany) {
    notFound()
  }

  const canEdit = profile.role === 'admin' || profile.permissions?.edit_contacts

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit company</h1>
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

      {canEdit && (
        <div className="mt-6">
          <PartnerCompanyDeleteButton partnerCompanyId={partnerCompany.id} />
        </div>
      )}
    </div>
  )
}
