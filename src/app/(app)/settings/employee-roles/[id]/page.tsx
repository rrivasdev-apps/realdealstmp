import { notFound } from 'next/navigation'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { EmployeeRoleCommissionForm } from '../employee-role-commission-form'

export default async function EmployeeRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireProfile()

  if (!profile || profile.role !== 'admin') {
    return (
      <div>
        <h1 className="text-xl font-semibold">Employee role</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only admins can manage settings.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: employeeRole }, { data: commissionTypes }, { data: assignments }] = await Promise.all([
    supabase.from('employee_roles').select('id, name').eq('id', id).single(),
    supabase.from('commission_types').select('id, name').order('name'),
    supabase.from('employee_role_commission_types').select('commission_type_id').eq('employee_role_id', id),
  ])

  if (!employeeRole) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{employeeRole.name}</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Commission types checked here apply to every employee with this role.
      </p>

      <div className="mt-6">
        <EmployeeRoleCommissionForm
          employeeRoleId={employeeRole.id}
          initialCommissionTypeIds={(assignments ?? []).map((row) => row.commission_type_id)}
          commissionTypes={commissionTypes ?? []}
        />
      </div>
    </div>
  )
}
