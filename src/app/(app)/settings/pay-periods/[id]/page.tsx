import { notFound } from 'next/navigation'

import { requirePermission } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { PayPeriodForm } from '../../pay-period-form'

export default async function PayPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const profile = await requirePermission('can_manage_settings')

  if (!profile) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Pay period</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only managers can manage settings.</p>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: payPeriod } = await supabase
    .from('pay_periods')
    .select(
      'id, name, payment_type, salary_pay_frequency, salary_type, commission_pay_frequency, first_payday, next_payday, comments'
    )
    .eq('id', id)
    .single()

  if (!payPeriod) {
    notFound()
  }

  return (
    <div>
      <h1 className="text-xl font-semibold">{payPeriod.name}</h1>

      <div className="mt-6">
        <PayPeriodForm
          mode="edit"
          initialValues={{
            id: payPeriod.id,
            name: payPeriod.name,
            paymentType: payPeriod.payment_type ?? '',
            salaryPayFrequency: payPeriod.salary_pay_frequency ?? '',
            salaryType: payPeriod.salary_type ?? '',
            commissionPayFrequency: payPeriod.commission_pay_frequency ?? '',
            firstPayday: payPeriod.first_payday ?? '',
            nextPayday: payPeriod.next_payday ?? '',
            comments: payPeriod.comments ?? '',
          }}
        />
      </div>
    </div>
  )
}
