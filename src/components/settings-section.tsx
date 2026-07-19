'use client'

import type { ReactNode } from 'react'

import { HashSection } from './hash-section'

export const DEFAULT_SETTINGS_SECTION = 'markets'

export function SettingsSection({ id, title, children }: { id: string; title?: string; children: ReactNode }) {
  return (
    <HashSection id={id} defaultId={DEFAULT_SETTINGS_SECTION} title={title}>
      {children}
    </HashSection>
  )
}
