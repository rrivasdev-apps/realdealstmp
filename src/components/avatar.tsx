// Initials-in-a-circle avatar for list rows (Contacts, Team, Payroll). No
// per-profile color is stored anywhere, so the background is picked
// deterministically from the name itself -- the same person always lands
// on the same color without needing a new DB column.
const PALETTE = [
  'bg-brand-600',
  'bg-landing-cyan',
  'bg-landing-lime-dark',
  'bg-landing-navy',
] as const

function hashName(name: string) {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0
  }
  return hash
}

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const bg = PALETTE[hashName(name) % PALETTE.length]

  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${bg} ${className ?? ''}`}
      aria-hidden="true"
    >
      {initialsFor(name)}
    </div>
  )
}
