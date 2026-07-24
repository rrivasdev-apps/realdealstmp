// Pure functions -- no I/O -- reused identically by the global dashboard and
// the per-deal view (src/lib/deals/kpi.ts's `referenceDate` idiom) so the
// overdue/due-today/due-this-week coloring can never drift between the two
// surfaces, per the reference doc's explicit requirement.

export type DueBucket = 'overdue' | 'due_today' | 'due_this_week' | 'due_later'

function toUtcDayNumber(dateInput: string | Date): number {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00Z`) : dateInput
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86400000)
}

export function bucketDueDate(dueAt: string, referenceDate: Date = new Date()): DueBucket {
  const diff = toUtcDayNumber(dueAt) - toUtcDayNumber(referenceDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'due_today'
  if (diff <= 6) return 'due_this_week'
  return 'due_later'
}

// Approximate under branching (a skipped branch can finish "early") --
// accepted as the simplest workable formula per the Milestone 1 plan's note.
// Clamped so a running process never visually reads as 100% before it
// actually completes.
export function computeProcessProgress({
  completedStepCount,
  templateStepCount,
  status,
}: {
  completedStepCount: number
  templateStepCount: number
  status: 'pending_start' | 'running' | 'completed'
}): number {
  if (status === 'completed') return 100
  if (templateStepCount <= 0) return 0
  const raw = Math.round((completedStepCount / templateStepCount) * 100)
  return Math.min(99, Math.max(0, raw))
}
