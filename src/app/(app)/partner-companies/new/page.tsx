import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { PartnerCompanyForm } from '../partner-company-form'

export default async function NewPartnerCompanyPage() {
  const profile = await requirePermission('edit_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">New company</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to create companies.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: companyTypes } = await supabase.from('company_types').select('id, name').order('name')

  return (
    <div>
      <h1 className="text-xl font-semibold">New company</h1>
      <div className="mt-6">
        <PartnerCompanyForm
          mode="create"
          initialValues={{ name: '', address: '', email: '', phone: '', companyTypeIds: [] }}
          companyTypes={companyTypes ?? []}
        />
      </div>
    </div>
  )
}
