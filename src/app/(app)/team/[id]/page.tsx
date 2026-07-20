import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { EmployeeForm } from '../employee-form'

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_team')

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Team member</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to manage team members.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: member }, { data: employeeRoles }, { data: commissionTypes }, { data: assignments }] =
    await Promise.all([
      supabase.from('profiles').select('id, name, email, employee_role_id, pay_type, pay_rate').eq('id', id).single(),
      supabase.from('employee_roles').select('id, name').order('name'),
      supabase.from('commission_types').select('id, name').order('name'),
      supabase.from('profile_commission_types').select('commission_type_id').eq('profile_id', id),
    ])

  if (!member) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{member.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{member.email}</p>

      <div className="mt-6">
        <EmployeeForm
          profileId={member.id}
          initialEmployeeRoleId={member.employee_role_id ?? ''}
          initialCommissionTypeIds={(assignments ?? []).map((row) => row.commission_type_id)}
          initialPayType={member.pay_type ?? ''}
          initialPayRate={member.pay_rate?.toString() ?? ''}
          employeeRoles={employeeRoles ?? []}
          commissionTypes={commissionTypes ?? []}
        />
      </div>
    </div>
  )
}
