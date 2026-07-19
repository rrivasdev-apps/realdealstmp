'use client'

import type { ReactNode } from 'react'

import { HashSection } from './hash-section'

export const DEFAULT_DEAL_SECTION = 'deal-info'

export function DealSection({ id, title, children }: { id: string; title?: string; children: ReactNode }) {
  return (
    <HashSection id={id} defaultId={DEFAULT_DEAL_SECTION} title={title}>
      {children}
    </HashSection>
  )
}
