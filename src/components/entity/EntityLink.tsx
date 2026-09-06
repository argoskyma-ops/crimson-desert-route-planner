import { ENTITY_LABELS } from '../../content/types'
import { useAppStore } from '../../store'

export function UnknownId({ id }: { id: string }) {
  return (
    <span className="text-amber-400" title="No record with this id yet">
      {id}
    </span>
  )
}

export default function EntityLink({ id }: { id: string }) {
  const record = useAppStore((s) => s.content.byId.get(id))
  const selectEntity = useAppStore((s) => s.selectEntity)

  if (record === undefined) {
    return <UnknownId id={id} />
  }

  return (
    <button
      type="button"
      onClick={() => selectEntity(id)}
      className="inline-flex min-h-8 max-w-full items-center gap-1.5 py-1 text-left text-sm text-sky-300 hover:text-sky-200"
    >
      <span className="min-w-0 truncate">{record.name}</span>
      <span className="shrink-0 text-[10px] tracking-wide text-neutral-500 uppercase">
        {ENTITY_LABELS[record.type]}
      </span>
    </button>
  )
}

export function LinkList({ ids }: { ids?: readonly string[] }) {
  if (ids === undefined || ids.length === 0) return null
  return (
    <ul className="space-y-0.5">
      {ids.map((itemId) => (
        <li key={itemId}>
          <EntityLink id={itemId} />
        </li>
      ))}
    </ul>
  )
}
