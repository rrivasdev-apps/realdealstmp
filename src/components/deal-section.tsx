'use client'

import { useEffect, useState, type ReactNode } from 'react'

// Deal detail sections are switched via the sidebar (see sidebar.tsx), not a
// route change or a tab bar in the page itself -- window.location.hash is
// the one shared signal both sides read independently, so switching doesn't
// remount the page and doesn't lose unsaved edits in the deal form.
export const DEFAULT_DEAL_SECTION = 'deal-info'

export function DealSection({
  id,
  title,
  children,
}: {
  id: string
  title?: string
  children: ReactNode
}) {
  // Starts at the default on both server and client render to avoid a
  // hydration mismatch; the real hash (if any) is applied client-only below.
  const [active, setActive] = useState(DEFAULT_DEAL_SECTION)

  useEffect(() => {
    const sync = () => setActive(window.location.hash.slice(1) || DEFAULT_DEAL_SECTION)
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

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
