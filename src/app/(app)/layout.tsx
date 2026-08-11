import { redirect } from 'next/navigation'

import { requireProfile } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

import { Sidebar, type NavKey } from './sidebar'

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

  // Fetched here rather than added to requireProfile()'s select, which nearly
  // every mutating API route calls -- none of those need the company's name,
  // and this is the one place it's displayed. RLS allows it: "Members can view
  // their own company" (20260715000001_companies_and_profiles.sql).
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', profile.company_id ?? '')
    .maybeSingle()

  const navItem = (href: string, labelKey: NavKey) => ({ href, labelKey })
  const navItems = [
    navItem('/dashboard', 'dashboard'),
    ...(canViewWhiteboard ? [navItem('/deals', 'whiteboard')] : []),
    // Contacts and Companies (formerly its own top-level "Investor LLCs"
    // item) are now rendered as a Contact Center sub-menu -- see
    // CONTACT_HUB_LINKS in sidebar.tsx.
    ...(canViewContacts ? [navItem('/contacts', 'contactCenter')] : []),
    ...(canManagePayroll ? [navItem('/payroll', 'payroll')] : []),
    // Same visibility tier as the Whiteboard -- it's a company-wide
    // operational view, not Settings/configuration.
    ...(canViewWhiteboard ? [navItem('/deal-automations', 'dealAutomations')] : []),
    ...(canManageSettings ? [navItem('/settings', 'settings')] : []),
  ]

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Sidebar
        navItems={navItems}
        canManageTeam={canManageTeam}
        companyName={company?.name ?? ''}
        userName={profile.name}
        userRole={profile.role}
      />
      <main className="flex-1 overflow-y-auto bg-surface px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
