import { redirect } from 'next/navigation'

import { requireProfile } from '@/lib/supabase/auth'

import { Sidebar } from './sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()
  if (!profile) {
    redirect('/login')
  }

  const canManageSettings = profile.role === 'admin' || profile.permissions?.can_manage_settings
  const canManagePayroll = profile.role === 'admin' || profile.permissions?.can_manage_payroll
  const canViewWhiteboard = profile.role === 'admin' || profile.permissions?.view_whiteboard
  const canViewContacts = profile.role === 'admin' || profile.permissions?.view_contacts
  // Team now lives inside Settings > Employee Center (see requireTeamAccess
  // in auth.ts) instead of being its own top-level nav item, per Rafael --
  // specifically so reaching it requires the same access as Settings.
  const canManageTeam =
    profile.role === 'admin' || Boolean(profile.permissions?.can_manage_team && profile.permissions?.can_manage_settings)

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    ...(canViewWhiteboard ? [{ href: '/deals', label: 'Whiteboard' }] : []),
    // Contacts and Companies (formerly its own top-level "Investor LLCs"
    // item) are now rendered as a Contact Center sub-menu -- see
    // CONTACT_HUB_LINKS in sidebar.tsx.
    ...(canViewContacts ? [{ href: '/contacts', label: 'Contact Center' }] : []),
    ...(canManagePayroll ? [{ href: '/payroll', label: 'Payroll' }] : []),
    // Same visibility tier as the Whiteboard -- it's a company-wide
    // operational view, not Settings/configuration.
    ...(canViewWhiteboard ? [{ href: '/deal-automations', label: 'Deal Automations' }] : []),
    ...(canManageSettings ? [{ href: '/settings', label: 'Settings' }] : []),
  ]

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Sidebar navItems={navItems} canManageTeam={canManageTeam} userName={profile.name} userRole={profile.role} />
      <main className="flex-1 overflow-y-auto bg-surface px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
