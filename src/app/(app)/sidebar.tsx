'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogoutButton } from './logout-button'

type NavItem = { href: string; label: string }

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
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-active text-white'
                  : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
              }`}
            >
              {item.label}
            </Link>
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
