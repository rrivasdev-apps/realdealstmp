import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Avatar } from '@/components/avatar'
import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { NewRunForm } from './new-run-form'
import { PayrollPaymentForm } from './payroll-payment-form'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default async function PayrollPage() {
  const t = await getTranslations('Payroll')
  const profile = await requirePermission('can_manage_payroll')

  if (!profile || !profile.company_id) {
    return (
      <div>
        <h1 className="heading-page">{t('title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t('noPermission')}</p>
      </div>
    )
  }

  const STATUS_LABELS: Record<string, string> = {
    draft: t('statusDraft'),
    finalized: t('statusFinalized'),
  }

  const supabase = await createClient()
  const [{ data: employees }, { data: payments }, { data: company }, { data: runs }, { data: payPeriods }, { data: assignments }] =
    await Promise.all([
      supabase.from('profiles').select('id, name').is('deleted_at', null).order('name'),
      supabase
        .from('payments')
        .select('id, amount, pay_period_start, pay_period_end, profiles(name)')
        .eq('type', 'payroll')
        .order('pay_period_end', { ascending: false }),
      supabase.from('companies').select('subscription_tier').eq('id', profile.company_id).single(),
      supabase
        .from('payroll_runs')
        .select('id, pay_period_start, pay_period_end, status, pay_periods(name)')
        .order('pay_period_end', { ascending: false }),
      supabase
        .from('pay_periods')
        .select('id, name, salary_pay_frequency, commission_pay_frequency, first_payday, next_payday')
        .order('name'),
      // Drives the New Run form's pre-empt: a schedule whose members all lack a
      // pay type/rate can't produce a payable run, and saying so up front beats
      // a server error after the fact.
      supabase.from('profile_pay_periods').select('pay_period_id, profiles!inner(pay_type, pay_rate)'),
    ])

  const hasEmployeeCenter = company?.subscription_tier === 'employee_center'

  const payableCountByPayPeriod = new Map<string, number>()
  for (const assignment of assignments ?? []) {
    if (assignment.profiles?.pay_type == null || assignment.profiles?.pay_rate == null) continue
    payableCountByPayPeriod.set(assignment.pay_period_id, (payableCountByPayPeriod.get(assignment.pay_period_id) ?? 0) + 1)
  }

  return (
    <div>
      <h1 className="heading-page">{t('title')}</h1>

      <section className="mt-6">
        <h2 className="heading-subsection">{t('recordPaymentHeading')}</h2>
        <div className="mt-2 max-w-xl">
          <PayrollPaymentForm employees={employees ?? []} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="heading-subsection">{t('historyHeading')}</h2>
        <ul className="mt-2 list-container">
          {(payments ?? []).map((payment) => (
            <li key={payment.id} className="list-row">
              <div className="flex items-center gap-3">
                <Avatar name={payment.profiles?.name ?? t('unknownEmployee')} />
                <div>
                  <span className="font-medium text-foreground">{payment.profiles?.name ?? t('unknownEmployee')}</span>
                  <div className="text-muted-foreground">
                    {payment.pay_period_start} – {payment.pay_period_end}
                  </div>
                </div>
              </div>
              <span>{payment.amount != null ? currency.format(payment.amount) : '—'}</span>
            </li>
          ))}
          {(payments ?? []).length === 0 && (
            <li className="px-4 py-3 text-sm text-muted-foreground">{t('noPaymentsYet')}</li>
          )}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="heading-subsection">{t('runsHeading')}</h2>
        {hasEmployeeCenter ? (
          <>
            <div className="mt-2 max-w-xl">
              <NewRunForm
                payPeriods={(payPeriods ?? []).map((payPeriod) => ({
                  ...payPeriod,
                  payable_employee_count: payableCountByPayPeriod.get(payPeriod.id) ?? 0,
                }))}
              />
            </div>
            <ul className="mt-4 list-container">
              {(runs ?? []).map((run) => (
                <li key={run.id} className="list-row">
                  <div>
                    <Link href={`/payroll/runs/${run.id}`} className="font-medium text-foreground hover:underline">
                      {run.pay_period_start} – {run.pay_period_end}
                    </Link>
                    <div className="text-muted-foreground">{run.pay_periods?.name ?? t('adHocRunLabel')}</div>
                  </div>
                  <span
                    className={
                      run.status === 'finalized' ? 'pill bg-success/10 text-success' : 'pill bg-muted text-muted-foreground'
                    }
                  >
                    {STATUS_LABELS[run.status] ?? run.status}
                  </span>
                </li>
              ))}
              {(runs ?? []).length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">{t('noRunsYet')}</li>
              )}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t('employeeCenterOnlyMessage')}</p>
        )}
      </section>
    </div>
  )
}
