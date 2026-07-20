import { redirect } from 'next/navigation'

import { requireProfile } from '@/lib/supabase/auth'

import { Sidebar } from './sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()
  if (!profile) {
    redirect('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/deals', label: 'Whiteboard' },
    { href: '/contacts', label: 'Contact Hub' },
    { href: '/investor-llcs', label: 'Investor LLCs' },
    ...(profile.role === 'admin'
      ? [
          { href: '/team', label: 'Team' },
          { href: '/settings', label: 'Settings' },
        ]
      : []),
  ]

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <Sidebar navItems={navItems} userName={profile.name} userRole={profile.role} />
      <main className="flex-1 overflow-y-auto bg-surface px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  )
}
