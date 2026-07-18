'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { DEFAULT_DEAL_SECTION } from '@/components/deal-section'

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
  { id: 'employees', label: 'Employees' },
]

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
  const [activeSection, setActiveSection] = useState(DEFAULT_DEAL_SECTION)

  useEffect(() => {
    if (!isDealDetail) return
    const sync = () => setActiveSection(window.location.hash.slice(1) || DEFAULT_DEAL_SECTION)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [isDealDetail])

  return (
    <aside className="flex w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-5 py-6">
        <span className="text-lg font-semibold tracking-tight">
          Real<span className="text-brand-400">Deals</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
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
