import { NextResponse } from 'next/server'

import { advanceStalledProcesses, evaluateTriggersForDateBased } from '@/lib/automations/runtime'
import { createAdminClient } from '@/lib/supabase/admin'

// Scheduled sweep for the two automation triggers that can't fire off a
// single deal create/update request: date_based triggers, and processes
// stuck in pending_start waiting out a template's start_delay_days. Runs
// company-wide via the service-role client since there's no request-scoped
// user session to derive RLS from -- see src/lib/supabase/admin.ts.
//
// Host-agnostic on purpose: this is just an HTTP endpoint gated by a shared
// secret (CRON_SECRET). vercel.json wires Vercel Cron to call it on a
// schedule; any other scheduler (a local cron job, a GitHub Actions
// workflow, an external pinger) works the same way against the same URL --
// only the scheduler changes if this moves off Vercel or runs locally.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const [started, advanced] = await Promise.all([evaluateTriggersForDateBased(supabase), advanceStalledProcesses(supabase)])

  return NextResponse.json({ started, advanced })
}
