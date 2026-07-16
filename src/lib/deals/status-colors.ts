// Maps the fixed deal_statuses names (see supabase/migrations) to the status
// color tokens in globals.css -- one place to look up "what color is this
// status" for badges, KPI cards, etc.
const STATUS_COLORS: Record<string, { text: string; bg: string; dot: string }> = {
  'For Sale': { text: 'text-status-for-sale', bg: 'bg-status-for-sale/10', dot: 'bg-status-for-sale' },
  'Pending Sale': {
    text: 'text-status-pending-sale',
    bg: 'bg-status-pending-sale/10',
    dot: 'bg-status-pending-sale',
  },
  Closed: { text: 'text-status-closed', bg: 'bg-status-closed/10', dot: 'bg-status-closed' },
  'On Hold': { text: 'text-status-on-hold', bg: 'bg-status-on-hold/10', dot: 'bg-status-on-hold' },
  Cancelled: { text: 'text-status-cancelled', bg: 'bg-status-cancelled/10', dot: 'bg-status-cancelled' },
}

const FALLBACK = { text: 'text-zinc-600', bg: 'bg-zinc-100', dot: 'bg-zinc-400' }

export function statusColors(statusName: string | null | undefined) {
  return (statusName && STATUS_COLORS[statusName]) || FALLBACK
}
