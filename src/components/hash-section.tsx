'use client'

import { useEffect, useState, type ReactNode } from 'react'

// Shared primitive behind DealSection and SettingsSection: sections are
// switched via a sidebar (see sidebar.tsx), not a route change or an in-page
// tab bar -- window.location.hash is the one signal both sides read
// independently, so switching doesn't remount the page or lose unsaved
// edits in whatever form lives in the active section.
export function HashSection({
  id,
  defaultId,
  title,
  children,
}: {
  id: string
  defaultId: string
  title?: string
  children: ReactNode
}) {
  // Starts at the default on both server and client render to avoid a
  // hydration mismatch; the real hash (if any) is applied client-only below.
  const [active, setActive] = useState(defaultId)

  useEffect(() => {
    const sync = () => setActive(window.location.hash.slice(1) || defaultId)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [defaultId])

  if (active !== id) {
    return null
  }

  return (
    <div id={id}>
      {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
      <div className={title ? 'mt-4 flex flex-col gap-6' : 'flex flex-col gap-6'}>{children}</div>
    </div>
  )
}
