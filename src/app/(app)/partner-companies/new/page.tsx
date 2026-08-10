import { getTranslations } from 'next-intl/server'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { PartnerCompanyForm } from '../partner-company-form'

export default async function NewPartnerCompanyPage() {
  const t = await getTranslations('PartnerCompanies')
  const profile = await requirePermission('edit_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('newTitle')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('newNoPermission')}</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: companyTypes } = await supabase.from('company_types').select('id, name').order('name')

  return (
    <div>
      <h1 className="heading-page">{t('newTitle')}</h1>
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
