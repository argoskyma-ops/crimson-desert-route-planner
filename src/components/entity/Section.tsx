import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children?: ReactNode }) {
  if (children == null || children === false || children === '') return null
  if (Array.isArray(children) && children.length === 0) return null
  return (
    <section className="mt-4">
      <h3 className="text-[10px] font-semibold tracking-wider text-neutral-500 uppercase">
        {title}
      </h3>
      <div className="mt-1">{children}</div>
    </section>
  )
}

export function Field({ label, children }: { label: string; children?: ReactNode }) {
  if (children == null || children === false || children === '') return null
  return (
    <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="min-w-0 text-neutral-100">{children}</span>
    </div>
  )
}

export function Badge({
  children,
  warning = false,
}: {
  children: ReactNode
  warning?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${
        warning
          ? 'bg-amber-500/15 text-amber-300'
          : 'border border-white/10 bg-neutral-800/80 text-neutral-300'
      }`}
    >
      {children}
    </span>
  )
}

export function PanelButton({
  children,
  onClick,
  disabled,
  title,
  hiddenOnMd,
  expanded,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  hiddenOnMd?: boolean
  expanded?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-expanded={expanded}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-800/80 ${
        hiddenOnMd ? 'md:hidden' : ''
      }`}
    >
      {children}
    </button>
  )
}

export function StatGrid({ stats }: { stats?: Record<string, string | number> }) {
  if (stats === undefined) return null
  const entries = Object.entries(stats)
  if (entries.length === 0) return null
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
      {entries.map(([name, value]) => (
        <li key={name} className="flex justify-between gap-2">
          <span className="text-neutral-500">{name}</span>
          <span className="tabular-nums text-neutral-100">{value}</span>
        </li>
      ))}
    </ul>
  )
}
