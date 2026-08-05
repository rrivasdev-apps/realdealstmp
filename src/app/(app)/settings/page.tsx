import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { ListImportForm } from '@/components/list-import-form'
import { SettingsSection } from '@/components/settings-section'
import { SimpleListForm } from '@/components/simple-list-form'
import { getPayPeriodLabels } from '@/lib/pay-periods/labels'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { ChecklistItemForm } from './checklist-item-form'
import { CitiesSection } from './cities-section'
import { CommissionTypeForm } from './commission-type-form'
import { CommissionTypeListItem } from './commission-type-list-item'
import { CountryForm } from './country-form'
import { CustomFieldDefinitionForm } from './custom-field-definition-form'
import { DefaultCountryForm } from './default-country-form'
import { EmployeeRoleForm } from './employee-role-form'
import { PayPeriodForm, type PayPeriodFormValues } from './pay-period-form'
import { StatesSection } from './states-section'

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
  const t = await getTranslations('Settings')
  const profile = await requirePermission('can_manage_settings')

  if (!profile) {
    return (
      <div>
        <h1 className="heading-page">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermission')}</p>
      </div>
    )
  }

  const FIELD_TYPE_LABELS: Record<string, string> = {
    text: t('fieldTypeText'),
    number: t('fieldTypeNumber'),
    date: t('fieldTypeDate'),
    checkbox: t('fieldTypeCheckbox'),
    select: t('fieldTypeSelect'),
  }
  const { SALARY_PAY_FREQUENCY_LABELS, COMMISSION_PAY_FREQUENCY_LABELS } = getPayPeriodLabels(t)

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
    { data: expenseCategories },
    { data: customFieldDefinitions },
    { data: payPeriods },
    { data: countries },
    { data: company },
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
    supabase.from('expense_categories').select('id, name').order('name'),
    supabase.from('custom_field_definitions').select('id, name, field_type, options').order('name'),
    supabase
      .from('pay_periods')
      .select('id, name, payment_type, salary_pay_frequency, commission_pay_frequency, next_payday')
      .order('name'),
    supabase.from('countries').select('id, name, iso_code').order('name'),
    supabase.from('companies').select('default_country_id').eq('id', profile.company_id ?? '').single(),
  ])

  return (
    <div>
      <h1 className="heading-page">{t('title')}</h1>

      <div className="mt-6">
        <SettingsSection id="markets" title={t('marketsTitle')}>
          <p className="text-sm text-muted-foreground">{t('marketsDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/markets" placeholder={t('marketsPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {markets?.map((market) => (
              <li key={market.id} className="py-2 text-sm">
                {market.name}
              </li>
            ))}
            {markets?.length === 0 && <li className="py-2 text-sm text-muted-foreground">{t('noMarketsYet')}</li>}
          </ul>
        </SettingsSection>

        <SettingsSection id="countries" title={t('countriesTitle')}>
          <p className="text-sm text-muted-foreground">{t('countriesDescription')}</p>
          <div className="max-w-md">
            <CountryForm />
          </div>
          <div className="max-w-md">
            <ListImportForm
              endpoint="/api/countries/import"
              placeholder={t('countriesImportPlaceholder')}
              hint={t('countriesImportHint')}
            />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {countries?.map((country) => (
              <li key={country.id} className="py-2 text-sm">
                {country.name}
                <span className="ml-2 text-xs text-muted-foreground">{country.iso_code}</span>
              </li>
            ))}
            {countries?.length === 0 && <li className="py-2 text-sm text-muted-foreground">{t('noCountriesYet')}</li>}
          </ul>
        </SettingsSection>

        <SettingsSection id="states" title={t('statesTitle')}>
          <p className="text-sm text-muted-foreground">{t('statesDescription')}</p>
          <StatesSection countries={countries ?? []} defaultCountryId={company?.default_country_id ?? null} />
        </SettingsSection>

        <SettingsSection id="cities" title={t('citiesTitle')}>
          <p className="text-sm text-muted-foreground">{t('citiesDescription')}</p>
          <CitiesSection countries={countries ?? []} defaultCountryId={company?.default_country_id ?? null} />
        </SettingsSection>

        <SettingsSection id="default-country" title={t('defaultCountryTitle')}>
          <p className="text-sm text-muted-foreground">{t('defaultCountryDescription')}</p>
          <DefaultCountryForm countries={countries ?? []} defaultCountryId={company?.default_country_id ?? null} />
        </SettingsSection>

        <SettingsSection id="deal-types" title={t('dealTypesTitle')}>
          <p className="text-sm text-muted-foreground">{t('dealTypesDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/deal-types" placeholder={t('dealTypesPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {dealTypes?.map((dealType) => (
              <li key={dealType.id} className="py-2 text-sm">
                {dealType.name}
              </li>
            ))}
            {dealTypes?.length === 0 && <li className="py-2 text-sm text-muted-foreground">{t('noDealTypesYet')}</li>}
          </ul>
        </SettingsSection>

        <SettingsSection id="lead-sources" title={t('leadSourcesTitle')}>
          <p className="text-sm text-muted-foreground">{t('leadSourcesDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/lead-sources" placeholder={t('leadSourcesPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {leadSources?.map((leadSource) => (
              <li key={leadSource.id} className="py-2 text-sm">
                {leadSource.name}
              </li>
            ))}
            {leadSources?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noLeadSourcesYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="expense-categories" title={t('expenseCategoriesTitle')}>
          <p className="text-sm text-muted-foreground">{t('expenseCategoriesDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/expense-categories" placeholder={t('expenseCategoriesPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {expenseCategories?.map((expenseCategory) => (
              <li key={expenseCategory.id} className="py-2 text-sm">
                {expenseCategory.name}
              </li>
            ))}
            {expenseCategories?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noExpenseCategoriesYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="custom-fields" title={t('customFieldsTitle')}>
          <p className="text-sm text-muted-foreground">{t('customFieldsDescription')}</p>
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
              <li className="py-2 text-sm text-muted-foreground">{t('noCustomFieldsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="on-hold-reasons" title={t('onHoldReasonsTitle')}>
          <p className="text-sm text-muted-foreground">{t('onHoldReasonsDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/on-hold-reasons" placeholder={t('onHoldReasonsPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {onHoldReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {onHoldReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noOnHoldReasonsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="selling-reasons" title={t('sellingReasonsTitle')}>
          <p className="text-sm text-muted-foreground">{t('sellingReasonsDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/selling-reasons" placeholder={t('sellingReasonsPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {sellingReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {sellingReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noSellingReasonsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="cancelled-ab-reasons" title={t('cancelledAbReasonsTitle')}>
          <p className="text-sm text-muted-foreground">{t('cancelledAbReasonsDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm endpoint="/api/cancelled-ab-reasons" placeholder={t('cancelledAbReasonsPlaceholder')} />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {cancelledAbReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {cancelledAbReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noCancelledAbReasonsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="cancelled-bc-ac-reasons" title={t('cancelledBcAcReasonsTitle')}>
          <p className="text-sm text-muted-foreground">{t('cancelledBcAcReasonsDescription')}</p>
          <div className="max-w-md">
            <SimpleListForm
              endpoint="/api/cancelled-bc-ac-reasons"
              placeholder={t('cancelledBcAcReasonsPlaceholder')}
            />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {cancelledBcAcReasons?.map((reason) => (
              <li key={reason.id} className="py-2 text-sm">
                {reason.name}
              </li>
            ))}
            {cancelledBcAcReasons?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noCancelledBcAcReasonsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="checklist-items" title={t('checklistItemsTitle')}>
          <p className="text-sm text-muted-foreground">{t('checklistItemsDescription')}</p>
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
              <li className="py-2 text-sm text-muted-foreground">{t('noChecklistItemsYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="commission-types" title={t('commissionTypesTitle')}>
          <p className="text-sm text-muted-foreground">{t('commissionTypesDescription')}</p>
          <div className="max-w-xl">
            <CommissionTypeForm />
          </div>
          <ul className="max-w-xl divide-y divide-border">
            {commissionTypes?.map((commissionType) => (
              <CommissionTypeListItem key={commissionType.id} commissionType={commissionType} />
            ))}
            {commissionTypes?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noCommissionTypesYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="employee-roles" title={t('employeeRolesTitle')}>
          <p className="text-sm text-muted-foreground">{t('employeeRolesDescription')}</p>
          <div className="max-w-md">
            <EmployeeRoleForm />
          </div>
          <ul className="max-w-md divide-y divide-border">
            {employeeRoles?.map((role) => (
              <li key={role.id} className="py-2 text-sm">
                <Link href={`/settings/employee-roles/${role.id}`} className="hover:underline">
                  {role.name}
                </Link>
                <span className="ml-2 text-xs text-muted-foreground">{t('manageCommissionTypesHint')}</span>
              </li>
            ))}
            {employeeRoles?.length === 0 && (
              <li className="py-2 text-sm text-muted-foreground">{t('noEmployeeRolesYet')}</li>
            )}
          </ul>
        </SettingsSection>

        <SettingsSection id="pay-periods" title={t('payPeriodsTitle')}>
          <p className="text-sm text-muted-foreground">{t('payPeriodsDescription')}</p>
          <PayPeriodForm mode="create" initialValues={EMPTY_PAY_PERIOD} />
          <div className="max-w-2xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">{t('payPeriodNameHeader')}</th>
                  <th className="py-2 pr-4 font-medium">{t('salaryPayFrequencyHeader')}</th>
                  <th className="py-2 pr-4 font-medium">{t('commissionPayFrequencyHeader')}</th>
                  <th className="py-2 font-medium">{t('nextPayDayHeader')}</th>
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
                      {t('noPayPeriodsYet')}
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
