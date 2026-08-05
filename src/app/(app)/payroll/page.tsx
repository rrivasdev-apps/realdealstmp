import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

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
  const [{ data: employees }, { data: payments }, { data: company }, { data: runs }] = await Promise.all([
    supabase.from('profiles').select('id, name').order('name'),
    supabase
      .from('payments')
      .select('id, amount, pay_period_start, pay_period_end, profiles(name)')
      .eq('type', 'payroll')
      .order('pay_period_end', { ascending: false }),
    supabase.from('companies').select('subscription_tier').eq('id', profile.company_id).single(),
    supabase
      .from('payroll_runs')
      .select('id, pay_period_start, pay_period_end, status')
      .order('pay_period_end', { ascending: false }),
  ])

  const hasEmployeeCenter = company?.subscription_tier === 'employee_center'

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
        <ul className="mt-2 divide-y divide-border rounded-lg border border-border bg-background">
          {(payments ?? []).map((payment) => (
            <li
              key={payment.id}
              className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-medium">{payment.profiles?.name ?? t('unknownEmployee')}</span>
                <div className="text-muted-foreground">
                  {payment.pay_period_start} – {payment.pay_period_end}
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
              <NewRunForm />
            </div>
            <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-background">
              {(runs ?? []).map((run) => (
                <li key={run.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link href={`/payroll/runs/${run.id}`} className="font-medium hover:underline">
                    {run.pay_period_start} – {run.pay_period_end}
                  </Link>
                  <span className="rounded bg-muted px-2 py-1 text-xs font-medium">
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
