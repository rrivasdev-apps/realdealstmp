import 'server-only'

const PAYMENT_TYPES = ['salary', 'commission', 'combined']
const SALARY_PAY_FREQUENCIES = ['weekly', 'biweekly', 'once_a_month', 'twice_a_month']
const SALARY_TYPES = ['fixed', 'hourly']
const COMMISSION_PAY_FREQUENCIES = ['weekly', 'biweekly', 'once_a_month', 'twice_a_month', 'quarterly', 'immediately_on_closing']

export type PayPeriodFields = {
  name: string
  payment_type: string
  salary_pay_frequency: string | null
  salary_type: string | null
  commission_pay_frequency: string | null
  comments: string
}

// Shared by create (POST /api/pay-periods) and edit (PATCH
// /api/pay-periods/[id]) -- payment_type drives which of
// salary_pay_frequency/salary_type/commission_pay_frequency are actually
// required, same progressive-disclosure rule the form itself follows (see
// docs/reference/payroll-periods.md). Never trust the client to have
// enforced this -- re-validate here regardless of what the form already did.
export function parsePayPeriodFields(body: Record<string, unknown>): { data: PayPeriodFields } | { error: string } {
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return { error: 'Pay period name is required.' }
  }

  const paymentType = typeof body.payment_type === 'string' ? body.payment_type : ''
  if (!PAYMENT_TYPES.includes(paymentType)) {
    return { error: 'Payment type is required.' }
  }

  const needsSalary = paymentType === 'salary' || paymentType === 'combined'
  const needsCommission = paymentType === 'commission' || paymentType === 'combined'

  const salaryPayFrequency = typeof body.salary_pay_frequency === 'string' ? body.salary_pay_frequency : ''
  if (needsSalary && !SALARY_PAY_FREQUENCIES.includes(salaryPayFrequency)) {
    return { error: 'Salary pay frequency is required.' }
  }

  const salaryType = typeof body.salary_type === 'string' ? body.salary_type : ''
  if (needsSalary && !SALARY_TYPES.includes(salaryType)) {
    return { error: 'Salary type is required.' }
  }

  const commissionPayFrequency = typeof body.commission_pay_frequency === 'string' ? body.commission_pay_frequency : ''
  if (needsCommission && !COMMISSION_PAY_FREQUENCIES.includes(commissionPayFrequency)) {
    return { error: 'Commission pay frequency is required.' }
  }

  const comments = typeof body.comments === 'string' ? body.comments.trim() : ''
  if (!comments) {
    return { error: 'Comments/observations are required.' }
  }

  return {
    data: {
      name,
      payment_type: paymentType,
      salary_pay_frequency: needsSalary ? salaryPayFrequency : null,
      salary_type: needsSalary ? salaryType : null,
      commission_pay_frequency: needsCommission ? commissionPayFrequency : null,
      comments,
    },
  }
}
