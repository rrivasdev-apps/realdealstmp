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

export const CAPABILITY_GROUPS: { label: string; keys: (keyof Capabilities)[] }[] = [
  {
    label: 'RealDeal features',
    keys: ['view_whiteboard', 'view_deal_detail', 'edit_deal_detail', 'view_contacts', 'edit_contacts', 'can_manage_settings'],
  },
  {
    label: 'Employee Center features',
    keys: ['can_manage_team', 'can_manage_payroll', 'can_view_financials'],
  },
]

export const CAPABILITY_LABELS: Record<keyof Capabilities, string> = {
  view_whiteboard: 'View the deal whiteboard',
  view_deal_detail: 'View a deal’s detail page',
  edit_deal_detail: 'Edit a deal (including offers, showings, checklist, employees)',
  view_contacts: 'View Contact Center',
  edit_contacts: 'Create/edit contacts',
  can_manage_settings: 'Manage settings (lookups, commission types)',
  can_manage_team: 'Manage team (invite, edit roles, pay rates)',
  can_manage_payroll: 'Process payroll (record payments, run payroll)',
  can_view_financials: "View the whole company's financials on the dashboard",
}
