import type messages from '@/messages/en.json'

export type SettingsKey = keyof (typeof messages)['Settings']

// Shared shape for anything that renders/edits the 9 capability flags --
// both employee_roles' own template editor (Settings > Employee Roles) and
// the per-employee override editor (Team > employee detail) render the same
// two groups, just against a different endpoint.
export type Capabilities = {
  view_whiteboard: boolean
  view_deal_detail: boolean
  edit_deal_detail: boolean
  view_contacts: boolean
  edit_contacts: boolean
  can_manage_settings: boolean
  can_manage_team: boolean
  can_manage_payroll: boolean
  can_view_financials: boolean
}

// id (stable) + labelKey (translated at render time via each consumer's own
// useTranslations('Settings')) -- not a translated label directly, per the
// i18n rule that display labels can't double as identifiers/comparison keys.
export const CAPABILITY_GROUPS: { id: string; labelKey: SettingsKey; keys: (keyof Capabilities)[] }[] = [
  {
    id: 'realdeal-features',
    labelKey: 'groupRealDealFeatures',
    keys: ['view_whiteboard', 'view_deal_detail', 'edit_deal_detail', 'view_contacts', 'edit_contacts', 'can_manage_settings'],
  },
  {
    id: 'employee-center-features',
    labelKey: 'groupEmployeeCenterFeatures',
    keys: ['can_manage_team', 'can_manage_payroll', 'can_view_financials'],
  },
]

export const CAPABILITY_LABEL_KEYS: Record<keyof Capabilities, SettingsKey> = {
  view_whiteboard: 'capViewWhiteboard',
  view_deal_detail: 'capViewDealDetail',
  edit_deal_detail: 'capEditDealDetail',
  view_contacts: 'capViewContacts',
  edit_contacts: 'capEditContacts',
  can_manage_settings: 'capManageSettings',
  can_manage_team: 'capManageTeam',
  can_manage_payroll: 'capManagePayroll',
  can_view_financials: 'capViewFinancials',
}
