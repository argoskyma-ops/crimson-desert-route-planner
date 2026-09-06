import { useState } from 'react'
import { search, type SearchIndex } from '../../content/search'
import type { EntityType } from '../../content/ids'
import { btnClass, inputClass } from './ui'
import { FieldLabel } from './SimpleFields'

function entityHits(index: SearchIndex, query: string, entityType: EntityType | 'any') {
  return search(index, query, 8, {
    filter: (hit) =>
      hit.kind === 'entity' && (entityType === 'any' || hit.type === entityType),
  }).flatMap((group) => group.hits)
}

export function IdPicker({
  label,
  value,
  entityType,
  index,
  onChange,
  selectOnly = false,
}: {
  label?: string
  value: string
  entityType: EntityType | 'any'
  index: SearchIndex
  onChange: (id: string) => void
  selectOnly?: boolean
}) {
  const [query, setQuery] = useState('')
  const [typed, setTyped] = useState('')
  const shown = selectOnly ? typed : value
  const hits = query.trim().length === 0 ? [] : entityHits(index, query, entityType)

  function commit(id: string) {
    if (id === '') return
    onChange(id)
    setQuery('')
    if (selectOnly) setTyped('')
  }

  return (
    <div>
      {label ? <FieldLabel label={label} /> : null}
      <input
        type="text"
        value={shown}
        onChange={(event) => {
          if (selectOnly) setTyped(event.target.value)
          else onChange(event.target.value)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && selectOnly) {
            event.preventDefault()
            commit(shown)
          }
        }}
        placeholder="type:slug"
        className={inputClass}
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search records…"
        className={`${inputClass} mt-1`}
      />
      {hits.length > 0 ? (
        <ul className="mt-1 max-h-40 overflow-auto rounded-lg border border-white/10 bg-neutral-900/90">
          {hits.map((hit) => (
            <li key={hit.ref}>
              <button
                type="button"
                onClick={() => commit(hit.ref)}
                className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-neutral-800/90"
              >
                <span className="min-w-0 flex-1 truncate">{hit.name}</span>
                <span className="shrink-0 text-xs text-neutral-400">{hit.ref}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export function IdListEditor({
  label,
  value,
  entityType,
  index,
  onChange,
}: {
  label: string
  value: unknown
  entityType: EntityType | 'any'
  index: SearchIndex
  onChange: (value: string[]) => void
}) {
  const ids = Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []

  function add(id: string) {
    if (id === '' || ids.includes(id)) return
    onChange([...ids, id])
  }

  return (
    <div>
      <FieldLabel label={label} />
      {ids.length > 0 ? (
        <ul className="mb-1 flex flex-wrap gap-1">
          {ids.map((id) => (
            <li
              key={id}
              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-white/10 bg-neutral-800/80 px-2 text-xs"
            >
              <span className="max-w-[12rem] truncate">{id}</span>
              <button
                type="button"
                onClick={() => onChange(ids.filter((item) => item !== id))}
                className={btnClass}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <IdPicker value="" entityType={entityType} index={index} onChange={add} selectOnly />
    </div>
  )
}

export function StringListEditor({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (value: string[]) => void
}) {
  const items = Array.isArray(value) ? value.filter((item) => typeof item === 'string') : []

  return (
    <div>
      <FieldLabel label={label} />
      <div className="space-y-1">
        {items.map((item, index) => (
          <div key={index} className="flex gap-1">
            <input
              type="text"
              value={item}
              onChange={(event) => {
                const next = items.slice()
                next[index] = event.target.value
                onChange(next)
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className={btnClass}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ''])} className={btnClass}>
          Add
        </button>
      </div>
    </div>
  )
}
