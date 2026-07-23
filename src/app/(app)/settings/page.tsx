import Link from 'next/link'

import { SettingsSection } from '@/components/settings-section'
import { SimpleListForm } from '@/components/simple-list-form'
import { COMMISSION_PAY_FREQUENCY_LABELS, SALARY_PAY_FREQUENCY_LABELS } from '@/lib/pay-periods/labels'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ChecklistItemForm } from './checklist-item-form'
import { CommissionTypeForm } from './commission-type-form'
import { CustomFieldDefinitionForm } from './custom-field-definition-form'
import { EmployeeRoleForm } from './employee-role-form'
import { PayPeriodForm, type PayPeriodFormValues } from './pay-period-form'

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  checkbox: 'Checkbox',
  select: 'Dropdown',
}

const CATEGORY_LABELS: Record<string, string> = {
  flat: 'Flat fee',
  percentage: 'Percentage',
}

const BASIS_LABELS: Record<string, string> = {
  contract_price: 'contract price',
  gross_profit: 'gross profit',
  current_selling_price: 'current selling price',
}

const EMPTY_PAY_PERIOD: PayPeriodFormValues = {
  name: '',
  paymentType: '',
  salaryPayFrequency: '',
  salaryType: '',
  commissionPayFrequency: '',
  firstPayday: '',
  nextPayday: '',
  comments: '',
}

export default async function SettingsPage() {
  const profile = await requirePermission('can_manage_settings')

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to manage settings.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [
    { data: employeeRoles },
    { data: commissionTypes },
    { data: checklistItems },
    { data: onHoldReasons },
    { data: cancelledAbReasons },
    { data: cancelledBcAcReasons },
    { data: sellingReasons },
    { data: markets },
    { data: dealTypes },
    { data: leadSources },
    { data: customFieldDefinitions },
    { data: payPeriods },
  ] = await Promise.all([
    supabase.from('employee_roles').select('id, name').order('name'),
    supabase
      .from('commission_types')
      .select('id, name, description, category, basis, value')
      .order('name'),
    supabase.from('checklist_items').select('id, name').order('name'),
    supabase.from('on_hold_reasons').select('id, name').order('name'),
    supabase.from('cancelled_ab_reasons').select('id, name').order('name'),
    supabase.from('cancelled_bc_ac_reasons').select('id, name').order('name'),
    supabase.from('selling_reasons').select('id, name').order('name'),
    supabase.from('markets').select('id, name').order('name'),
    supabase.from('deal_types').select('id, name').order('name'),
    supabase.from('lead_sources').select('id, name').order('name'),
    supabase.from('custom_field_definitions').select('id, name, field_type, options').order('name'),
    supabase
      .from('pay_periods')
      .select('id, name, payment_type, salary_pay_frequency, commission_pay_frequency, next_payday')
      .order('name'),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="mt-6">
        <SettingsSection id="markets" title="Markets">
          <p className="text-sm text-muted-foreground">
            The markets deals can be assigned to. Seeded with a default market at signup.
          </p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/markets" placeholder="e.g. Dallas-Fort Worth" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {markets?.map((market) => (
              <li key={market.id} className="py-2 text-sm">
                {market.name}
              </li>
            ))}
            {markets?.length === 0 && <li className="py-2 text-sm text-muted-foreground">No markets yet.</li>}
          </ul>
        </SettingsSection>

        <SettingsSection id="deal-types" title="Deal Types">
          <p className="text-sm text-muted-foreground">
            The deal type options shown on the Deal Info section (Wholesale, Flip, etc.).
          </p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/deal-types" placeholder="e.g. Novation" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {dealTypes?.map((dealType) => (
              <li key={dealType.id} className="py-2 text-sm">
                {dealType.name}
              </li>
            ))}
            {dealTypes?.length === 0 && <li className="py-2 text-sm text-muted-foreground">No deal types yet.</li>}
          </ul>
        </SettingsSection>

        <SettingsSection id="lead-sources" title="Lead Sources">
          <p className="text-sm text-muted-foreground">Where deals are attributed as coming from.</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/lead-sources" placeholder="e.g. Facebook Ads" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {leadSources?.map((leadSource) => (
              <li key={leadSource.id} className="py-2 text-sm">
                {leadSource.name}
              </li>
            ))}
            {leadSources?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No lead sources yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="custom-fields" title="Custom Fields">
          <p className="text-sm text-muted-foreground">
            Extra fields shown on every deal&apos;s Custom Fields tab, in addition to the built-in ones.
          </p>
          <div className="max-w-md">
            <CustomFieldDefinitionForm />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {customFieldDefinitions?.map((field) => (
              <li key={field.id} className="py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{field.name}</span>
                  <span className="text-muted-foreground">{FIELD_TYPE_LABELS[field.field_type] ?? field.field_type}</span>
                </div>
                {field.field_type === 'select' && field.options && (
                  <div className="mt-1 text-xs text-muted-foreground">{field.options.join(', ')}</div>
                )}
              </li>
            ))}
            {customFieldDefinitions?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No custom fields yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="on-hold-reasons" title="On Hold Reasons">
          <p className="text-sm text-muted-foreground">
            Options shown when a deal is checked &ldquo;On hold&rdquo; in its checklist.
          </p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/on-hold-reasons" placeholder="e.g. Waiting on lender" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {onHoldReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {onHoldReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No on hold reasons yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="selling-reasons" title="Selling Reasons">
          <p className="text-sm text-muted-foreground">Options shown for &ldquo;Reasons for selling&rdquo; on Deal Info.</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/selling-reasons" placeholder="e.g. Relocating" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {sellingReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {sellingReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No selling reasons yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="cancelled-ab-reasons" title="Cancelled — AB Reasons">
          <p className="text-sm text-muted-foreground">
            Options shown when a deal is checked &ldquo;Cancelled — AB&rdquo; in its checklist.
          </p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/cancelled-ab-reasons" placeholder="e.g. Seller found another buyer" />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {cancelledAbReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {cancelledAbReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No cancelled AB reasons yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="cancelled-bc-ac-reasons" title="Cancelled — BC/AC Reasons">
          <p className="text-sm text-muted-foreground">
            Options shown when a deal is checked &ldquo;Cancelled — BC/AC&rdquo; in its checklist.
          </p>
          <div className="max-w-md">
            <SimpleListForm
              endpoint="/api/cancelled-bc-ac-reasons"
              placeholder="e.g. Buyer's financing fell through"
            />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {cancelledBcAcReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {cancelledBcAcReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No cancelled BC/AC reasons yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="checklist-items" title="Checklist Items">
          <p className="text-sm text-muted-foreground">
            Custom checklist items available on every deal, in addition to the built-in ones. Plain checkboxes
            — no associated fields.
          </p>
          <div className="max-w-md">
            <ChecklistItemForm />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {checklistItems?.map((item) => (
              <li key={item.id} className="py-2 text-sm">
                {item.name}
              </li>
            ))}
            {checklistItems?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No custom checklist items yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="commission-types" title="Deal Commissions">
          <p className="text-sm text-muted-foreground">
            Commission types available to assign to employees or roles. Applied automatically when an
            employee is added to a deal.
          </p>
          <div className="max-w-xl">
            <CommissionTypeForm />
          </div>
          <ul className="max-w-xl divide-y divide-border">
            {commissionTypes?.map((commissionType) => (
              <li key={commissionType.id} className="py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{commissionType.name}</span>
                  <span className="text-muted-foreground">
                    {commissionType.category === 'flat'
                      ? `$${commissionType.value}`
                      : `${commissionType.value}% of ${BASIS_LABELS[commissionType.basis ?? ''] ?? commissionType.basis}`}
                    {' · '}
                    {CATEGORY_LABELS[commissionType.category] ?? commissionType.category}
                  </span>
                </div>
                {commissionType.description && (
                  <div className="mt-1 text-muted-foreground">{commissionType.description}</div>
                )}
              </li>
            ))}
            {commissionTypes?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No commission types yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="employee-roles" title="Employee Roles">
          <p className="text-sm text-muted-foreground">
            Org-wide job titles. Assign one to a team member on their profile to apply any commission types
            assigned to that role.
          </p>
          <div className="max-w-md">
            <EmployeeRoleForm />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {employeeRoles?.map((role) => (
              <li key={role.id} className="py-2 text-sm">
                <Link href={`/settings/employee-roles/${role.id}`} className="hover:underline">
                  {role.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">manage commission types</span>
              </li>
            ))}
            {employeeRoles?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">No employee roles yet.</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="pay-periods" title="Pay Periods">
          <p className="text-sm text-muted-foreground">
            Payroll schedules (e.g. Weekly Salary, Monthly Commissions) an employee can be tagged with — more than
            one can apply to the same employee.
          </p>
          <PayPeriodForm mode="create" initialValues={EMPTY_PAY_PERIOD} />
          <div className="max-w-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Pay Period Name</th>
                  <th className="py-2 pr-4 font-medium">Salary Pay Frequency</th>
                  <th className="py-2 pr-4 font-medium">Commission Pay Frequency</th>
                  <th className="py-2 font-medium">Next Pay Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payPeriods?.map((payPeriod) => (
                  <tr key={payPeriod.id}>
                    <td className="py-2 pr-4">
                      <Link href={`/settings/pay-periods/${payPeriod.id}`} className="hover:underline">
                        {payPeriod.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {payPeriod.salary_pay_frequency ? SALARY_PAY_FREQUENCY_LABELS[payPeriod.salary_pay_frequency] : ''}
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {payPeriod.commission_pay_frequency
                        ? COMMISSION_PAY_FREQUENCY_LABELS[payPeriod.commission_pay_frequency]
                        : ''}
                    </td>
                    <td className="py-2 text-muted-foreground">{payPeriod.next_payday ?? ''}</td>
                  </tr>
                ))}
                {payPeriods?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-2 text-sm text-muted-foreground">
                      No pay periods yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}
