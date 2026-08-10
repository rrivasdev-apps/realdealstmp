import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerCompaniesPage() {
  const t = await getTranslations('PartnerCompanies')
  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermission')}</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: partnerCompanies } = await supabase
    .from('partner_companies')
    .select('id, name, address, email, phone, partner_company_types(company_types(name))')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-page">{t('title')}</h1>
        <Link href="/partner-companies/new" className="rounded bg-foreground px-4 py-2 text-sm text-background">
          {t('newCompanyButton')}
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('listSubtitle')}</p>

      <ul className="mt-6 divide-y divide-border">
        {partnerCompanies?.map((partnerCompany) => {
          const types = partnerCompany.partner_company_types
            .map((row) => row.company_types?.name)
            .filter(Boolean)
            .join(', ')

          return (
            <li key={partnerCompany.id} className="py-3">
              <Link href={`/partner-companies/${partnerCompany.id}`} className="font-medium hover:underline">
                {partnerCompany.name}
              </Link>
              <div className="text-sm text-muted-foreground">
                {[types, partnerCompany.address, partnerCompany.phone, partnerCompany.email]
                  .filter(Boolean)
                  .join(' · ') || t('noDetailsYet')}
              </div>
            </li>
          )
        })}
        {partnerCompanies?.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">{t('noCompaniesYet')}</li>
        )}
      </ul>
    </div>
  )
}
