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
    sections: [
      { id: 'employee-roles', label: 'Employee Roles' },
      { id: 'pay-periods', label: 'Pay Periods' },
    ],
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
  // Broader than just the exact /settings page -- sub-pages like an
  // employee role's detail page (/settings/employee-roles/[id]) still need
  // the same nested Settings sub-nav visible, just without hash-driven
  // section switching (that page isn't hash-sectioned).
  const isSettings = pathname === '/settings' || pathname.startsWith('/settings/')
  const [activeSection, setActiveSection] = useState(DEFAULT_DEAL_SECTION)
  const [activeSettingsSection, setActiveSettingsSection] = useState(DEFAULT_SETTINGS_SECTION)
  // Which group's sub-tabs are expanded -- normally follows activeSettingsSection
  // (whichever group owns it), but clicking a group label directly (e.g. an
  // empty group like Contact Hub with nothing to navigate to) overrides it
  // without touching the hash.
  const [expandedSettingsGroup, setExpandedSettingsGroup] = useState(() =>
    settingsGroupForSection(DEFAULT_SETTINGS_SECTION),
  )
  // Drawer open state, mobile only (the <aside> is a permanent rail at lg
  // regardless of this value -- see the lg: classes below). Starts false on
  // both server and client render, same as activeSection/activeSettingsSection
  // above, so there's no hydration mismatch.
  const [open, setOpen] = useState(false)
  // Closing on route change is a render-time state adjustment (React's
  // recommended pattern for "reset state when a prop changes"), not an
  // effect, so it doesn't cascade an extra render.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!isDealDetail) return
    const sync = () => setActiveSection(window.location.hash.slice(1) || DEFAULT_DEAL_SECTION)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isDealDetail])

  useEffect(() => {
    if (!isSettings || pathname !== '/settings') return
    const sync = () => {
      const section = window.location.hash.slice(1) || DEFAULT_SETTINGS_SECTION
      setActiveSettingsSection(section)
      setExpandedSettingsGroup(settingsGroupForSection(section))
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isSettings, pathname])

  // Sub-pages (e.g. an employee role's detail page) aren't hash-sectioned --
  // derive the active section straight from the pathname at render time
  // instead of syncing it into state, so the sub-nav still highlights/
  // expands the right group there instead of just vanishing.
  const settingsSubpageSection =
    isSettings && pathname !== '/settings'
      ? pathname.startsWith('/settings/employee-roles')
        ? 'employee-roles'
        : DEFAULT_SETTINGS_SECTION
      : null
  const effectiveSettingsSection = settingsSubpageSection ?? activeSettingsSection
  const effectiveExpandedSettingsGroup = settingsSubpageSection
    ? settingsGroupForSection(settingsSubpageSection)
    : expandedSettingsGroup

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <span className="text-lg font-semibold tracking-tight">
          Real<span className="text-brand-400">Deals</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-hover"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 ease-in-out lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
      <div className="flex items-center justify-between px-5 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Real<span className="text-brand-400">Deals</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
          className="rounded-md p-1 text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <nav className="momentum-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-3">
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
                    const groupExpanded = effectiveExpandedSettingsGroup === group.label
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
                                href={pathname === '/settings' ? `#${section.id}` : `/settings#${section.id}`}
                                className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                                  effectiveSettingsSection === section.id
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
    </>
  )
}
