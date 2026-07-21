import { notFound } from 'next/navigation'

import type { Capabilities } from '@/lib/employee-permissions/labels'
import { requireTeamAccess } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { EmployeeForm } from '../employee-form'
import { EmployeePermissionsForm } from '../employee-permissions-form'

const DEFAULT_CAPABILITIES: Capabilities = {
  view_whiteboard: false,
  view_deal_detail: false,
  edit_deal_detail: false,
  view_contacts: false,
  edit_contacts: false,
  can_manage_settings: false,
  can_manage_team: false,
  can_manage_payroll: false,
  can_view_financials: false,
}

export default async function TeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requireTeamAccess()

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Team member</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to manage team members.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [
    { data: member },
    { data: employeeRoles },
    { data: commissionTypes },
    { data: assignments },
    { data: roleAssignments },
    { data: permissions },
    { data: payPeriods },
    { data: payPeriodAssignments },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'id, name, email, pay_type, pay_rate, employee_type, hire_date, birth_date, address, paid_via, automatic_emails'
      )
      .eq('id', id)
      .single(),
    supabase.from('employee_roles').select('id, name').order('name'),
    supabase.from('commission_types').select('id, name').order('name'),
    supabase.from('profile_commission_types').select('commission_type_id').eq('profile_id', id),
    supabase.from('profile_employee_roles').select('employee_role_id').eq('profile_id', id),
    supabase
      .from('profile_permissions')
      .select(
        'view_whiteboard, view_deal_detail, edit_deal_detail, view_contacts, edit_contacts, can_manage_settings, can_manage_team, can_manage_payroll, can_view_financials'
      )
      .eq('profile_id', id)
      .maybeSingle(),
    supabase.from('pay_periods').select('id, name').order('name'),
    supabase.from('profile_pay_periods').select('pay_period_id').eq('profile_id', id),
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
          initialEmployeeRoleIds={(roleAssignments ?? []).map((row) => row.employee_role_id)}
          initialCommissionTypeIds={(assignments ?? []).map((row) => row.commission_type_id)}
          initialPayType={member.pay_type ?? ''}
          initialPayRate={member.pay_rate?.toString() ?? ''}
          initialEmployeeType={member.employee_type ?? ''}
          initialHireDate={member.hire_date ?? ''}
          initialBirthDate={member.birth_date ?? ''}
          initialAddress={member.address ?? ''}
          initialPaidVia={member.paid_via ?? ''}
          initialAutomaticEmails={member.automatic_emails}
          initialPayPeriodIds={(payPeriodAssignments ?? []).map((row) => row.pay_period_id)}
          employeeRoles={employeeRoles ?? []}
          commissionTypes={commissionTypes ?? []}
          payPeriods={payPeriods ?? []}
        />
      </div>

      <div className="mt-6">
        <EmployeePermissionsForm profileId={member.id} initialCapabilities={permissions ?? DEFAULT_CAPABILITIES} />
      </div>
    </div>
  )
}
