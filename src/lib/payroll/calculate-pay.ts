// One shared calc, per CLAUDE.md's rule for commission/profit math -- not
// duplicated inline wherever a payroll amount needs computing.
export function calculatePayAmount({
  pay_type,
  pay_rate,
  hours_worked,
}: {
  pay_type: string | null
  pay_rate: number | null
  hours_worked: number | null
}): number | null {
  if (pay_rate == null) {
    return null
  }
  if (pay_type === 'hourly') {
    return hours_worked != null ? hours_worked * pay_rate : null
  }
  if (pay_type === 'salary') {
    return pay_rate
  }
  return null
}
