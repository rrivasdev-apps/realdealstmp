import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { RunEntriesForm } from '../run-entries-form'

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_payroll')

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Payroll run</h1>
        <p className="mt-2 text-sm text-muted-foreground">You don&apos;t have permission to manage payroll.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const [{ data: run }, { data: entries }] = await Promise.all([
    supabase.from('payroll_runs').select('id, pay_period_start, pay_period_end, status').eq('id', id).single(),
    supabase
      .from('payroll_run_entries')
      .select('id, profile_id, hours_worked, computed_amount, profiles(name, pay_type, pay_rate)')
      .eq('payroll_run_id', id),
  ])

  if (!run) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">
        Payroll run: {run.pay_period_start} – {run.pay_period_end}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground capitalize">{run.status}</p>

      <div className="mt-6">
        <RunEntriesForm
          runId={run.id}
          isDraft={run.status === 'draft'}
          initialEntries={(entries ?? []).map((entry) => ({
            id: entry.id,
            profile_id: entry.profile_id,
            profile_name: entry.profiles?.name ?? 'Unknown',
            pay_type: entry.profiles?.pay_type ?? null,
            pay_rate: entry.profiles?.pay_rate ?? null,
            hours_worked: entry.hours_worked,
            computed_amount: entry.computed_amount,
          }))}
        />
      </div>
    </div>
  )
}
