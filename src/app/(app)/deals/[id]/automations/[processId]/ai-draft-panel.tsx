'use client'

import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'

export type AiOutput = {
  draft: string
  generated_at: string
  model: string
  regenerate_count: number
}

// The suggested message for an email_task/call_task step. Nothing is sent from
// here by design -- the assignee copies it into whatever they actually send
// from, so the draft stays a starting point rather than an outbox.
//
// Generation happens on first view rather than when the step was created: the
// cron sweep creates steps in a loop, and the deal may have moved on between
// scheduling and someone picking the task up. Once generated it's stored on the
// step, so a second visit costs nothing.
export function AiDraftPanel({ stepId, initialOutput }: { stepId: string; initialOutput: AiOutput | null }) {
  const t = useTranslations('Automations')
  const [output, setOutput] = useState<AiOutput | null>(initialOutput)
  const [loading, setLoading] = useState(!initialOutput)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  // Guards the auto-generate below against React's double-invoked effects in
  // development -- without it the first view fires two paid requests.
  const requestedRef = useRef(false)

  const generate = useCallback(
    async (regenerate: boolean) => {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/automation-steps/${stepId}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regenerate }),
      })
      const result = await response.json().catch(() => ({}))
      setLoading(false)

      if (!response.ok) {
        // Server error strings here are English on purpose (see auth-error.ts's
        // note); the codes are what the UI translates.
        if (result.code === 'not_configured') setError(t('aiDraftNotConfigured'))
        else if (result.code === 'regenerate_limit') setError(t('aiDraftRegenerateLimit'))
        else setError(t('aiDraftFailed'))
        return
      }
      setOutput(result.ai_output as AiOutput)
    },
    [stepId, t]
  )

  useEffect(() => {
    if (initialOutput || requestedRef.current) return
    requestedRef.current = true
    void generate(false)
  }, [initialOutput, generate])

  async function handleCopy() {
    if (!output) return
    await navigator.clipboard.writeText(output.draft)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="mt-4 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-foreground">{t('aiDraftPanelTitle')}</h3>
        {output && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted"
            >
              {copied ? t('aiDraftCopied') : t('aiDraftCopy')}
            </button>
            <button
              type="button"
              onClick={() => generate(true)}
              disabled={loading}
              className="rounded border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
            >
              {t('aiDraftRegenerate')}
            </button>
          </div>
        )}
      </div>

      {loading && <p className="mt-2 text-sm text-muted-foreground">{t('aiDraftGenerating')}</p>}

      {!loading && error && <p className="mt-2 text-sm text-muted-foreground">{error}</p>}

      {!loading && !error && output && (
        <>
          <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{output.draft}</p>
          <p className="mt-3 text-xs text-muted-foreground">{t('aiDraftDisclaimer')}</p>
        </>
      )}
    </section>
  )
}
