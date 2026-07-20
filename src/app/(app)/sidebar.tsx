'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { DEFAULT_DEAL_SECTION } from '@/components/deal-section'
import { DEFAULT_SETTINGS_SECTION } from '@/components/settings-section'

import { LogoutButton } from './logout-button'

type NavItem = { href: string; label: string }

// Ids/order must match the DealSection ids used in deal-form.tsx and
// deals/[id]/page.tsx -- clicking one of these just changes the browser
// hash, which those components independently watch to show/hide.
const DEAL_SECTIONS = [
  { id: 'deal-info', label: 'Deal Info' },
  { id: 'buyer-bc', label: 'Buyer / BC Contract' },
  { id: 'jv-dispo', label: 'JV & Dispo' },
  { id: 'financial', label: 'Financial' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'custom-fields', label: 'Custom Fields' },
  { id: 'employees', label: 'Employees' },
]

// Ids/order must match the SettingsSection ids used in settings/page.tsx --
// same hash-driven show/hide mechanism as DEAL_SECTIONS above, one level
// deeper (Settings -> group -> section).
const SETTINGS_GROUPS: { label: string; sections: { id: string; label: string }[] }[] = [
  {
    label: 'Deal',
    sections: [
      { id: 'markets', label: 'Markets' },
      { id: 'deal-types', label: 'Deal Types' },
      { id: 'lead-sources', label: 'Lead Sources' },
      { id: 'custom-fields', label: 'Custom Fields' },
      { id: 'on-hold-reasons', label: 'On Hold Reasons' },
      { id: 'cancelled-ab-reasons', label: 'Cancelled — AB Reasons' },
      { id: 'cancelled-bc-ac-reasons', label: 'Cancelled — BC/AC Reasons' },
      { id: 'checklist-items', label: 'Checklist Items' },
      { id: 'commission-types', label: 'Deal Commissions' },
    ],
  },
  {
    label: 'Employees',
    sections: [{ id: 'employee-roles', label: 'Employee Roles' }],
  },
  {
    label: 'Contact Hub',
    sections: [],
  },
]

function settingsGroupForSection(sectionId: string): string {
  return SETTINGS_GROUPS.find((group) => group.sections.some((section) => section.id === sectionId))?.label
    ?? SETTINGS_GROUPS[0].label
}

export function Sidebar({
  navItems,
  userName,
  userRole,
}: {
  navItems: NavItem[]
  userName: string
  userRole: string
}) {
  const pathname = usePathname()
  const isDealDetail = /^\/deals\/(?!new$)[^/]+$/.test(pathname)
  const isSettings = pathname === '/settings'
  const [activeSection, setActiveSection] = useState(DEFAULT_DEAL_SECTION)
  const [activeSettingsSection, setActiveSettingsSection] = useState(DEFAULT_SETTINGS_SECTION)
  // Which group's sub-tabs are expanded -- normally follows activeSettingsSection
  // (whichever group owns it), but clicking a group label directly (e.g. an
  // empty group like Contact Hub with nothing to navigate to) overrides it
  // without touching the hash.
  const [expandedSettingsGroup, setExpandedSettingsGroup] = useState(() =>
    settingsGroupForSection(DEFAULT_SETTINGS_SECTION),
  )

  useEffect(() => {
    if (!isDealDetail) return
    const sync = () => setActiveSection(window.location.hash.slice(1) || DEFAULT_DEAL_SECTION)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isDealDetail])

  useEffect(() => {
    if (!isSettings) return
    const sync = () => {
      const section = window.location.hash.slice(1) || DEFAULT_SETTINGS_SECTION
      setActiveSettingsSection(section)
      setExpandedSettingsGroup(settingsGroupForSection(section))
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isSettings])

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Real<span className="text-brand-400">Deals</span>
        </span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <div key={item.href}>
              <Link
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                }`}
              >
                {item.label}
              </Link>

              {item.href === '/deals' && isDealDetail && (
                <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  <div className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted">Deal</div>
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {DEAL_SECTIONS.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                          activeSection === section.id
                            ? 'bg-sidebar-active text-white'
                            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                        }`}
                      >
                        {section.label}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {item.href === '/settings' && isSettings && (
                <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {SETTINGS_GROUPS.map((group) => {
                    const groupExpanded = expandedSettingsGroup === group.label
                    return (
                      <div key={group.label}>
                        <button
                          type="button"
                          onClick={() => setExpandedSettingsGroup(group.label)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                            groupExpanded
                              ? 'text-sidebar-foreground'
                              : 'text-sidebar-muted hover:text-sidebar-foreground'
                          }`}
                        >
                          {group.label}
                        </button>
                        {groupExpanded && (
                          <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                            {group.sections.map((section) => (
                              <a
                                key={section.id}
                                href={`#${section.id}`}
                                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                  activeSettingsSection === section.id
                                    ? 'bg-sidebar-active text-white'
                                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                                }`}
                              >
                                {section.label}
                              </a>
                            ))}
                            {group.sections.length === 0 && (
                              <div className="px-3 py-1.5 text-sm text-sidebar-muted/70">No options yet</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="flex items-center justify-between gap-2 border-t border-white/10 px-5 py-4 text-sm">
        <div className="min-w-0">
          <div className="truncate font-medium">{userName}</div>
          <div className="text-xs capitalize text-sidebar-muted">{userRole}</div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  )
}
