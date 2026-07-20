import Link from 'next/link'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { InviteForm } from './invite-form'

export default async function TeamPage() {
  const profile = await requirePermission('can_manage_team')

  if (!profile) {
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
  const { data: members } = await supabase
    .from('profiles')
    .select('id, name, email, role, employee_roles(name)')
    .order('name')

  return (
    <div>
      <h1 className="text-xl font-semibold">Team</h1>

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
                {[member.email, member.employee_roles?.name].filter(Boolean).join(' · ')}
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
              {member.role}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
