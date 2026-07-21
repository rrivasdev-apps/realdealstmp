// Shared option lists for the Pay Period create/edit forms -- see
// docs/reference/payroll-periods.md for where these come from.
export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  salary: 'Salary',
  commission: 'Commission',
  combined: 'Combined',
}

export const SALARY_PAY_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Bi-Weekly',
  once_a_month: 'Once a Month',
  twice_a_month: 'Twice a Month',
}

export const SALARY_TYPE_LABELS: Record<string, string> = {
  fixed: 'Fixed Salary',
  hourly: 'Hourly',
}

export const COMMISSION_PAY_FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  once_a_month: 'Once a Month',
  twice_a_month: 'Twice a Month',
  quarterly: 'Quarterly',
  immediately_on_closing: 'Immediately on Closing',
}
