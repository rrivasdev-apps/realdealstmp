import { redirect } from 'next/navigation'

import { requireProfile } from '@/lib/supabase/auth'

import { Sidebar } from './sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile()
  if (!profile) {
    redirect('/login')
  }

  const navItems = [
    { href: '/dashboard', label: 'Whiteboard' },
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
    <div className="flex h-full">
      <Sidebar navItems={navItems} userName={profile.name} userRole={profile.role} />
      <main className="flex-1 overflow-y-auto bg-surface px-8 py-8">{children}</main>
    </div>
  )
}
