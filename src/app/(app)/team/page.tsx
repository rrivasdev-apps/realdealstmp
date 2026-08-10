import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { requireTeamAccess } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { EmployeeStatusButton } from './employee-status-button'
import { InviteForm } from './invite-form'

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  const showingDeleted = view === 'deleted'
  const t = await getTranslations('Team')
  const profile = await requireTeamAccess()

  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="heading-page">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermission')}</p>
      </div>
    )
  }

  const supabase = await createClient()
  const membersQuery = supabase
    .from('profiles')
    .select('id, name, email, role, deleted_at, profile_employee_roles(employee_roles(name))')
    .order('name')

  const [{ data: members }, { data: company }, { count: deletedCount }] = await Promise.all([
    showingDeleted ? membersQuery.not('deleted_at', 'is', null) : membersQuery.is('deleted_at', null),
    supabase.from('companies').select('subscription_tier').eq('id', profile.company_id).single(),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).not('deleted_at', 'is', null),
  ])

  const hasEmployeeCenter = company?.subscription_tier === 'employee_center'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="heading-page">{t('title')}</h1>
        <span className="text-sm text-muted-foreground">
          {t('employeeCenterPlan', { status: hasEmployeeCenter ? t('planYes') : t('planNo') })}
        </span>
      </div>

      {!showingDeleted && (
        <div className="mt-6">
          <InviteForm />
        </div>
      )}

      <nav className="mt-8 flex gap-2 border-b border-border text-sm">
        <Link
          href="/team"
          className={`-mb-px border-b-2 px-3 py-2 ${
            showingDeleted ? 'border-transparent text-muted-foreground hover:text-foreground' : 'border-foreground font-medium'
          }`}
        >
          {t('activeTab')}
        </Link>
        <Link
          href="/team?view=deleted"
          className={`-mb-px border-b-2 px-3 py-2 ${
            showingDeleted ? 'border-foreground font-medium' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {deletedCount ? t('deletedTabWithCount', { count: deletedCount }) : t('deletedTab')}
        </Link>
      </nav>

      <ul className="mt-4 divide-y divide-border">
        {members?.map((member) => (
          <li key={member.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/team/${member.id}`} className="font-medium hover:underline">
                {member.name}
              </Link>
              <div className="text-muted-foreground">
                {[
                  member.email,
                  member.profile_employee_roles.map((assignment) => assignment.employee_roles?.name).filter(Boolean).join(', '),
                  member.deleted_at ? t('deletedOn', { date: member.deleted_at.slice(0, 10) }) : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                {member.role === 'admin' ? t('roleAdmin') : t('roleStandard')}
              </span>
              <EmployeeStatusButton
                profileId={member.id}
                name={member.name}
                deleted={member.deleted_at != null}
              />
            </div>
          </li>
        ))}
        {members?.length === 0 && (
          <li className="py-3 text-sm text-muted-foreground">
            {showingDeleted ? t('noDeletedEmployees') : t('noActiveEmployees')}
          </li>
        )}
      </ul>
    </div>
  )
}
