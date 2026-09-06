import { useMemo, useState } from 'react'
import {
  codexFacets,
  codexTypeCounts,
  facetsFor,
  filterCodex,
  type FacetSelection,
} from '../content/codex'
import type { ContentDb } from '../content/db'
import { ENTITY_PLURALS, type Entity, type EntityType } from '../content/types'
import { useAppStore } from '../store'
import EntityLink from './entity/EntityLink'
import { Section } from './entity/Section'

const chipOn = 'border-white/20 bg-neutral-100 text-neutral-900'
const chipOff = 'border-white/10 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80'
const chipClass =
  'inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-800/80'

const RESULT_CAP = 50

function recordDetail(record: Entity, content: ContentDb) {
  for (const spec of facetsFor(record.type)) {
    if (spec.id === 'region') continue
    const picked = spec.valuesOf(record, content).find((value) => value !== 'none')
    if (picked !== undefined) return spec.labelOf?.(picked, content) ?? picked
  }
  if (record.region === undefined) return undefined
  const region = content.byId.get(record.region)
  return region?.name
}

export default function Codex() {
  const content = useAppStore((s) => s.content)
  const [type, setType] = useState<EntityType>('quest')
  const [selection, setSelection] = useState<FacetSelection>({})

  const typeCounts = useMemo(() => codexTypeCounts(content), [content])
  const facets = useMemo(() => codexFacets(content, type, selection), [content, type, selection])
  const results = useMemo(() => filterCodex(content, type, selection), [content, type, selection])

  if (content.byId.size === 0) {
    return <p className="mt-3 px-1 text-sm text-neutral-400">No content records yet.</p>
  }

  const shown = results.slice(0, RESULT_CAP)
  const more = results.length - shown.length

  return (
    <div className="mt-3">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {typeCounts.map((row) => {
          const selected = type === row.type
          const disabled = row.count === 0
          return (
            <button
              key={row.type}
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                if (row.type === type) return
                setType(row.type)
                setSelection({})
              }}
              className={`${chipClass} ${selected ? chipOn : chipOff}`}
            >
              {ENTITY_PLURALS[row.type]} {row.count}
            </button>
          )
        })}
      </div>

      {facets.map((facet) => (
        <Section key={facet.id} title={facet.label}>
          <div className="flex flex-wrap gap-1">
            {facet.values.map((entry) => {
              const selected = selection[facet.id] === entry.value
              return (
                <button
                  key={entry.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={entry.count === 0}
                  onClick={() => {
                    setSelection((current) => {
                      if (current[facet.id] === entry.value) {
                        const next = { ...current }
                        delete next[facet.id]
                        return next
                      }
                      return { ...current, [facet.id]: entry.value }
                    })
                  }}
                  className={`${chipClass} ${selected ? chipOn : chipOff}`}
                >
                  {entry.label} ({entry.count})
                </button>
              )
            })}
          </div>
        </Section>
      ))}

      <p className="mt-3 px-1 text-sm tabular-nums text-neutral-100">
        {results.length} {ENTITY_PLURALS[type]}
      </p>
      {results.length === 0 ? (
        <p className="mt-1 px-1 text-sm text-neutral-400">Nothing matches</p>
      ) : (
        <ul>
          {shown.map((record) => {
            const detail = recordDetail(record, content)
            return (
              <li key={record.id} className="flex min-h-11 flex-wrap items-center gap-x-2">
                <EntityLink id={record.id} />
                {detail !== undefined ? (
                  <span className="text-xs text-neutral-500">{detail}</span>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
      {more > 0 ? (
        <p className="mt-1 text-xs text-neutral-500">… and {more} more</p>
      ) : null}
    </div>
  )
}
