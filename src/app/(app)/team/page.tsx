import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { InviteForm } from './invite-form'

export default async function TeamPage() {
  const profile = await requirePermission('can_manage_team')

  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Team</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to manage the team.
        </p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: members }, { data: company }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email, role, profile_employee_roles(employee_roles(name))')
      .order('name'),
    supabase.from('companies').select('subscription_tier').eq('id', profile.company_id).single(),
  ])

  const hasEmployeeCenter = company?.subscription_tier === 'employee_center'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        <span className="text-sm text-muted-foreground">
          Employee Center plan: {hasEmployeeCenter ? 'Yes' : 'No'}
        </span>
      </div>

      <div className="mt-6">
        <InviteForm />
      </div>

      <ul className="mt-8 divide-y divide-border">
        {members?.map((member) => (
          <li key={member.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href={`/team/${member.id}`} className="font-medium hover:underline">
                {member.name}
              </Link>
              <div className="text-muted-foreground">
                {[
                  member.email,
                  member.profile_employee_roles.map((assignment) => assignment.employee_roles?.name).filter(Boolean).join(', '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
              {member.role === 'admin' ? 'Company Admin' : 'Standard'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
