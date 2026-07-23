import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

export default async function PartnerCompaniesPage() {
  const profile = await requirePermission('view_contacts')
  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Companies</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to view companies.</p>
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
        <h1 className="text-xl font-semibold">Companies</h1>
        <Link href="/partner-companies/new" className="rounded bg-foreground px-4 py-2 text-sm text-background">
          New company
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Title companies, brokerages, mortgage companies, and investor/JV partner LLCs available to pick from a deal.
      </p>

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
                  .join(' · ') || 'No details yet'}
              </div>
            </li>
          )
        })}
        {partnerCompanies?.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">No companies yet.</li>
        )}
      </ul>
    </div>
  )
}
