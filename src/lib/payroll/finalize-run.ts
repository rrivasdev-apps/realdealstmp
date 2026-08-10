import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { advancePayday, schedulingFrequency } from '@/lib/pay-periods/schedule'
import type { Database } from '@/lib/supabase/database.types'

import { calculatePayAmount } from './calculate-pay'

// A run created from a named pay period is what actually moves that period's
// next_payday forward -- the reference (docs/reference/payroll-periods.md) is
// explicit that next payday advances "on occurrence of the payroll that runs on
// this kind of pay period", not on a clock.
//
// Idempotent in the same retry-safe way as the payments insert above it: the
// guard is `next_payday <= the run's payday`, so a second finalize of the same
// run is a no-op instead of skipping a cycle. Advancing from the *run's* payday
// rather than from whatever next_payday currently holds is what makes that
// true, and it also means an admin who hand-edited next_payday forward keeps
// their edit.
async function advanceLinkedPayPeriod(
  supabase: SupabaseClient<Database>,
  run: { pay_period_id: string | null; pay_period_end: string }
) {
  if (!run.pay_period_id) {
    return
  }

  const { data: payPeriod } = await supabase
    .from('pay_periods')
    .select('id, salary_pay_frequency, commission_pay_frequency, first_payday, next_payday')
    .eq('id', run.pay_period_id)
    .single()

  if (!payPeriod) {
    return
  }

  const frequency = schedulingFrequency(payPeriod)
  const current = payPeriod.next_payday ?? payPeriod.first_payday
  if (!frequency || !current || current > run.pay_period_end) {
    return
  }

  await supabase
    .from('pay_periods')
    .update({ next_payday: advancePayday(run.pay_period_end, payPeriod.first_payday ?? run.pay_period_end, frequency) })
    .eq('id', payPeriod.id)
}

// Same non-transactional, retry-safe posture as syncCommissionPaymentsForDeal
// in src/lib/deals/commissions.ts -- if this fails partway, the run stays
// 'draft' (guarded below) and it's safe to call again; nothing else touches
// these rows in between so there's no need for a Postgres transaction.
export async function finalizeRun(supabase: SupabaseClient<Database>, runId: string) {
  const { data: run } = await supabase
    .from('payroll_runs')
    .select('id, company_id, pay_period_start, pay_period_end, pay_period_id, status')
    .eq('id', runId)
    .single()

  if (!run || run.status !== 'draft') {
    return
  }

  const { data: entries } = await supabase
    .from('payroll_run_entries')
    .select('id, profile_id, hours_worked, profiles(pay_type, pay_rate)')
    .eq('payroll_run_id', runId)

  if (!entries?.length) {
    return
  }

  // Guards against double-paying if a prior call inserted payments but
  // failed before flipping the run to 'finalized' (a real gap this exposed
  // once already, see 20260726000005/20260726000006) -- payments carries
  // payroll_run_id specifically so this check is possible.
  const { count: existingPaymentsCount } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('payroll_run_id', runId)

  const computed = entries.map((entry) => ({
    id: entry.id,
    profile_id: entry.profile_id,
    amount: calculatePayAmount({
      pay_type: entry.profiles?.pay_type ?? null,
      pay_rate: entry.profiles?.pay_rate ?? null,
      hours_worked: entry.hours_worked,
    }),
  }))

  await Promise.all(
    computed.map((entry) =>
      supabase.from('payroll_run_entries').update({ computed_amount: entry.amount }).eq('id', entry.id)
    )
  )

  const payableEntries = computed.filter((entry) => entry.amount != null && entry.amount > 0)
  if (payableEntries.length && !existingPaymentsCount) {
    await supabase.from('payments').insert(
      payableEntries.map((entry) => ({
        company_id: run.company_id,
        type: 'payroll',
        profile_id: entry.profile_id,
        amount: entry.amount,
        status: 'paid',
        pay_period_start: run.pay_period_start,
        pay_period_end: run.pay_period_end,
        payroll_run_id: runId,
      }))
    )
  }

  await advanceLinkedPayPeriod(supabase, run)

  await supabase
    .from('payroll_runs')
    .update({ status: 'finalized', finalized_at: new Date().toISOString() })
    .eq('id', runId)
}
