import type messages from '@/messages/en.json'

// Shared option lists for the Pay Period create/edit forms -- see
// docs/reference/payroll-periods.md for where these come from. A function
// rather than static records since the labels are translated: callers pass
// their own `useTranslations('Settings')` / `getTranslations('Settings')`
// instance so this works from both Server and Client Components.
type SettingsKey = keyof (typeof messages)['Settings']
type SettingsTranslator = (key: SettingsKey) => string

export function getPayPeriodLabels(t: SettingsTranslator) {
  return {
    PAYMENT_TYPE_LABELS: {
      salary: t('paymentTypeSalary'),
      commission: t('paymentTypeCommission'),
      combined: t('paymentTypeCombined'),
    } as Record<string, string>,

    SALARY_PAY_FREQUENCY_LABELS: {
      weekly: t('salaryFreqWeekly'),
      biweekly: t('salaryFreqBiweekly'),
      once_a_month: t('freqOnceAMonth'),
      twice_a_month: t('freqTwiceAMonth'),
    } as Record<string, string>,

    SALARY_TYPE_LABELS: {
      fixed: t('salaryTypeFixed'),
      hourly: t('salaryTypeHourly'),
    } as Record<string, string>,

    COMMISSION_PAY_FREQUENCY_LABELS: {
      weekly: t('commissionFreqWeekly'),
      biweekly: t('commissionFreqBiweekly'),
      once_a_month: t('freqOnceAMonth'),
      twice_a_month: t('freqTwiceAMonth'),
      quarterly: t('freqQuarterly'),
      immediately_on_closing: t('freqImmediatelyOnClosing'),
    } as Record<string, string>,
  }
}
