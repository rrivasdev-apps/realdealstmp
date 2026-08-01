'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { DEFAULT_DEAL_SECTION } from '@/components/deal-section'
import { DEFAULT_SETTINGS_SECTION } from '@/components/settings-section'
import type messages from '@/messages/en.json'

import { LogoutButton } from './logout-button'

export type NavKey = keyof (typeof messages)['Nav']
type NavItem = { href: string; labelKey: NavKey }

// Ids/order must match the DealSection ids used in deal-form.tsx and
// deals/[id]/page.tsx -- clicking one of these just changes the browser
// hash, which those components independently watch to show/hide. Labels are
// translation keys into messages/*.json's "Nav" namespace, resolved at
// render time below (module-scope constants can't call useTranslations).
const DEAL_SECTIONS: { id: string; labelKey: NavKey }[] = [
  { id: 'deal-info', labelKey: 'dealInfo' },
  { id: 'buyer-bc', labelKey: 'buyerBc' },
  { id: 'jv-dispo', labelKey: 'jvDispo' },
  { id: 'financial', labelKey: 'financial' },
  { id: 'checklist', labelKey: 'checklist' },
  { id: 'custom-fields', labelKey: 'customFields' },
  { id: 'employees', labelKey: 'employees' },
  // Not a hash section -- a real route (/deals/[id]/automations), so it's
  // rendered as a <Link> below instead of a hash <a>, matching how Settings'
  // Team entry works alongside its hash-anchored siblings.
  { id: 'automations', labelKey: 'automations' },
]

// Contact Center's sub-menu -- unlike DEAL_SECTIONS/SETTINGS_GROUPS these are
// real routes (two separate pages), not hash-anchored sections of one page,
// so they render as plain <Link>s highlighted by pathname instead of by hash.
const CONTACT_HUB_LINKS: { href: string; labelKey: NavKey }[] = [
  { href: '/contacts', labelKey: 'contacts' },
  { href: '/partner-companies', labelKey: 'companies' },
]

// Ids/order must match the SettingsSection ids used in settings/page.tsx --
// same hash-driven show/hide mechanism as DEAL_SECTIONS above, one level
// deeper (Settings -> group -> section). A section with an `href` is a real
// route (rendered as a <Link>, matched by pathname) instead of a hash-anchor
// within /settings -- Team is the one example, since /team is its own page,
// not a SettingsSection. Its `id` still has to exist here so
// settingsGroupForSection('team') resolves to the right group.
//
// Groups are identified by `id`, not their translated label -- expanded-group
// state must stay stable across locales (comparing translated strings would
// break the moment the app isn't in English).
const SETTINGS_GROUPS: { id: string; labelKey: NavKey; sections: { id: string; labelKey: NavKey; href?: string }[] }[] = [
  {
    id: 'deal',
    labelKey: 'settingsGroupDeal',
    sections: [
      { id: 'markets', labelKey: 'settingsMarkets' },
      { id: 'countries', labelKey: 'settingsCountries' },
      { id: 'states', labelKey: 'settingsStates' },
      { id: 'cities', labelKey: 'settingsCities' },
      { id: 'default-country', labelKey: 'settingsDefaultCountry' },
      { id: 'deal-types', labelKey: 'settingsDealTypes' },
      { id: 'lead-sources', labelKey: 'settingsLeadSources' },
      { id: 'expense-categories', labelKey: 'settingsExpenseCategories' },
      { id: 'custom-fields', labelKey: 'settingsCustomFields' },
      { id: 'on-hold-reasons', labelKey: 'settingsOnHoldReasons' },
      { id: 'cancelled-ab-reasons', labelKey: 'settingsCancelledAbReasons' },
      { id: 'cancelled-bc-ac-reasons', labelKey: 'settingsCancelledBcAcReasons' },
      { id: 'checklist-items', labelKey: 'settingsChecklistItems' },
    ],
  },
  {
    id: 'employee-center',
    labelKey: 'settingsGroupEmployeeCenter',
    sections: [
      { id: 'team', labelKey: 'settingsTeam', href: '/team' },
      { id: 'commission-types', labelKey: 'settingsCommissionTypes' },
      { id: 'employee-roles', labelKey: 'settingsEmployeeRoles' },
      { id: 'pay-periods', labelKey: 'settingsPayPeriods' },
    ],
  },
  {
    id: 'contact-center',
    labelKey: 'settingsGroupContactCenter',
    sections: [],
  },
  {
    id: 'deal-automations',
    labelKey: 'settingsGroupDealAutomations',
    sections: [{ id: 'automations', labelKey: 'automations', href: '/settings/automations' }],
  },
]

function settingsGroupForSection(sectionId: string): string {
  return SETTINGS_GROUPS.find((group) => group.sections.some((section) => section.id === sectionId))?.id
    ?? SETTINGS_GROUPS[0].id
}

export function Sidebar({
  navItems,
  canManageTeam,
  userName,
  userRole,
}: {
  navItems: NavItem[]
  canManageTeam: boolean
  userName: string
  userRole: string
}) {
  const pathname = usePathname()
  const isDealDetail = /^\/deals\/(?!new$)[^/]+$/.test(pathname)
  // Broader than isDealDetail (which is only the exact hash-sectioned edit
  // page) -- also true on real sub-routes like the deal's Automations pages,
  // so the Deal sub-nav (and an "Automations" entry within it) stays visible
  // there instead of vanishing the moment the URL gains another segment.
  const dealSubpageMatch = pathname.match(/^\/deals\/(?!new$)([^/]+)(\/.*)?$/)
  const isDealSubpage = Boolean(dealSubpageMatch)
  const dealId = dealSubpageMatch?.[1]
  const dealSubpageSection = pathname.includes('/automations') ? 'automations' : null
  const isContactHub = pathname === '/contacts' || pathname.startsWith('/contacts/') || pathname === '/partner-companies' || pathname.startsWith('/partner-companies/')
  // Broader than just the exact /settings page -- sub-pages like an
  // employee role's detail page (/settings/employee-roles/[id]) still need
  // the same nested Settings sub-nav visible, just without hash-driven
  // section switching (that page isn't hash-sectioned).
  const isSettings = pathname === '/settings' || pathname.startsWith('/settings/')
  // Team lives inside the Settings sub-nav now (Employee Center group) even
  // though /team isn't itself under /settings -- treated as a Settings
  // sub-page for sidebar purposes, same as employee-roles/[id] above.
  const isTeam = pathname === '/team' || pathname.startsWith('/team/')
  const t = useTranslations('Nav')
  const visibleSettingsGroups = SETTINGS_GROUPS.map((group) =>
    group.id === 'employee-center'
      ? { ...group, sections: group.sections.filter((section) => section.id !== 'team' || canManageTeam) }
      : group
  )

  // Sub-pages (e.g. an employee role's detail page, /team, or an
  // automation's builder) aren't hash-sectioned -- derive which
  // section/group they belong to straight from the pathname. Used only to
  // *seed/reset* state below when the pathname actually changes to one of
  // these (see the prevPathname block), not to force it on every render --
  // forcing it unconditionally was the bug: it made effectiveExpandedSettingsGroup
  // permanently pin to e.g. "Deal Automations" while parked on an
  // automation's builder page, so clicking a *different* group's header to
  // expand it (say, "Deal") visually did nothing and its sections (Markets,
  // etc.) never became clickable -- navigation looked "stuck."
  const settingsSubpageSection = isTeam
    ? 'team'
    : isSettings && pathname !== '/settings'
      ? pathname.startsWith('/settings/employee-roles')
        ? 'employee-roles'
        : pathname.startsWith('/settings/pay-periods')
          ? 'pay-periods'
          : pathname.startsWith('/settings/automations')
            ? 'automations'
            : DEFAULT_SETTINGS_SECTION
      : null

  const [activeSection, setActiveSection] = useState(DEFAULT_DEAL_SECTION)
  const [activeSettingsSection, setActiveSettingsSection] = useState(
    () => settingsSubpageSection ?? DEFAULT_SETTINGS_SECTION
  )
  // Which group's sub-tabs are expanded -- normally follows activeSettingsSection
  // (whichever group owns it), but clicking a group label directly (e.g. an
  // empty group like Contact Center with nothing to navigate to) overrides it
  // without touching the hash.
  const [expandedSettingsGroup, setExpandedSettingsGroup] = useState(() =>
    settingsGroupForSection(settingsSubpageSection ?? DEFAULT_SETTINGS_SECTION),
  )
  // Drawer open state, mobile only (the <aside> is a permanent rail at lg
  // regardless of this value -- see the lg: classes below). Starts false on
  // both server and client render, same as activeSection/activeSettingsSection
  // above, so there's no hydration mismatch.
  const [open, setOpen] = useState(false)
  // Closing on route change is a render-time state adjustment (React's
  // recommended pattern for "reset state when a prop changes"), not an
  // effect, so it doesn't cascade an extra render. Also re-seeds the
  // settings section/group *once, on the pathname change itself* when
  // landing on a new subpage -- after that, clicks are free to expand a
  // different group without being fought on every subsequent render.
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname)
    setOpen(false)
    if (settingsSubpageSection) {
      setActiveSettingsSection(settingsSubpageSection)
      setExpandedSettingsGroup(settingsGroupForSection(settingsSubpageSection))
    }
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

  const effectiveDealSection = dealSubpageSection ?? activeSection

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden">
        <span className="text-lg font-semibold tracking-tight">
          Real<span className="text-brand-400">Deals</span>
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('openMenu')}
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
          aria-label={t('closeMenu')}
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
                {t(item.labelKey)}
              </Link>

              {item.href === '/deals' && isDealSubpage && (
                <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  <div className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted">{t('deal')}</div>
                  <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                    {DEAL_SECTIONS.map((section) => {
                      const sectionActive = effectiveDealSection === section.id
                      const linkClassName = `rounded-md px-3 py-1.5 text-sm transition-colors ${
                        sectionActive
                          ? 'bg-sidebar-active text-white'
                          : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                      }`
                      return section.id === 'automations' ? (
                        <Link key={section.id} href={dealId ? `/deals/${dealId}/automations` : '#'} className={linkClassName}>
                          {t(section.labelKey)}
                        </Link>
                      ) : (
                        <a
                          key={section.id}
                          href={isDealDetail ? `#${section.id}` : `/deals/${dealId}#${section.id}`}
                          className={linkClassName}
                        >
                          {t(section.labelKey)}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}

              {item.href === '/contacts' && isContactHub && (
                <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {CONTACT_HUB_LINKS.map((link) => {
                    const linkActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                          linkActive
                            ? 'bg-sidebar-active text-white'
                            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                        }`}
                      >
                        {t(link.labelKey)}
                      </Link>
                    )
                  })}
                </div>
              )}

              {item.href === '/settings' && (isSettings || isTeam) && (
                <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                  {visibleSettingsGroups.map((group) => {
                    const groupExpanded = expandedSettingsGroup === group.id
                    return (
                      <div key={group.id}>
                        <button
                          type="button"
                          onClick={() => setExpandedSettingsGroup(group.id)}
                          className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                            groupExpanded
                              ? 'text-sidebar-foreground'
                              : 'text-sidebar-muted hover:text-sidebar-foreground'
                          }`}
                        >
                          {t(group.labelKey)}
                        </button>
                        {groupExpanded && (
                          <div className="ml-3 flex flex-col gap-0.5 border-l border-white/10 pl-3">
                            {group.sections.map((section) => {
                              const sectionActive = activeSettingsSection === section.id
                              const linkClassName = `rounded-md px-3 py-1.5 text-sm transition-colors ${
                                sectionActive
                                  ? 'bg-sidebar-active text-white'
                                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                              }`
                              return section.href ? (
                                <Link key={section.id} href={section.href} className={linkClassName}>
                                  {t(section.labelKey)}
                                </Link>
                              ) : (
                                <a
                                  key={section.id}
                                  href={pathname === '/settings' ? `#${section.id}` : `/settings#${section.id}`}
                                  className={linkClassName}
                                >
                                  {t(section.labelKey)}
                                </a>
                              )
                            })}
                            {group.sections.length === 0 && (
                              <div className="px-3 py-1.5 text-sm text-sidebar-muted/70">{t('noOptionsYet')}</div>
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
          <div className="text-xs capitalize text-sidebar-muted">
            {userRole === 'admin' ? t('roleAdmin') : t('roleMember')}
          </div>
        </div>
        <LogoutButton />
      </div>
      </aside>
    </>
  )
}
