import { isRecord } from './paths'
import { FieldLabel } from './SimpleFields'
import { btnClass, inputClass } from './ui'

interface SourceRow {
  url: string
  title?: string
  accessed?: string
  note?: string
}

function asRows(value: unknown): SourceRow[] {
  if (!Array.isArray(value) || value.length === 0) return [{ url: '' }]
  return value.map((item) => {
    if (!isRecord(item)) return { url: '' }
    return {
      url: typeof item.url === 'string' ? item.url : '',
      title: typeof item.title === 'string' ? item.title : undefined,
      accessed: typeof item.accessed === 'string' ? item.accessed : undefined,
      note: typeof item.note === 'string' ? item.note : undefined,
    }
  })
}

export function SourcesEditor({
  value,
  onChange,
}: {
  value: unknown
  onChange: (value: SourceRow[]) => void
}) {
  const rows = asRows(value)

  function update(index: number, patch: Partial<SourceRow>) {
    const next = rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    onChange(next)
  }

  return (
    <div>
      <FieldLabel label="sources" />
      <div className="space-y-2">
        {rows.map((row, index) => (
          <div key={index} className="space-y-1 rounded-lg border border-white/10 bg-neutral-900/60 p-2">
            <input
              type="url"
              value={row.url}
              onChange={(event) => update(index, { url: event.target.value })}
              placeholder="https://"
              required
              className={inputClass}
            />
            <input
              type="text"
              value={row.title ?? ''}
              onChange={(event) => update(index, { title: event.target.value })}
              placeholder="title"
              className={inputClass}
            />
            <input
              type="date"
              value={row.accessed ?? ''}
              onChange={(event) => update(index, { accessed: event.target.value })}
              className={inputClass}
            />
            <input
              type="text"
              value={row.note ?? ''}
              onChange={(event) => update(index, { note: event.target.value })}
              placeholder="note"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className={btnClass}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...rows, { url: '' }])} className={btnClass}>
          Add source
        </button>
      </div>
    </div>
  )
}
