import { useMemo } from 'react'
import { isPoiCheckable, poiGroupColor, poiGroupDefault, poiProgressKey } from '../config/pois'
import { countPois } from '../content/pois-loader'
import { useAppStore } from '../store'

const btnClass =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80'

const chipOn = 'border-white/20 bg-neutral-100 text-neutral-900'
const chipOff = 'border-white/10 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80'

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export default function LayersPanel() {
  const pois = useAppStore((s) => s.pois)
  const poisError = useAppStore((s) => s.poisError)
  const poiGroups = useAppStore((s) => s.poiGroups)
  const collected = useAppStore((s) => s.progress.collected)
  const togglePoiGroup = useAppStore((s) => s.togglePoiGroup)
  const setPoiGroup = useAppStore((s) => s.setPoiGroup)

  const counts = useMemo(() => (pois ? countPois(pois) : null), [pois])
  const collectedByType = useMemo(() => {
    const byType = new Map<string, number>()
    if (!pois) return byType
    const keys = new Set(collected)
    for (const node of pois.nodes) {
      if (!keys.has(poiProgressKey(node.id))) continue
      byType.set(node.type, (byType.get(node.type) ?? 0) + 1)
    }
    return byType
  }, [pois, collected])

  const enabledCount = pois
    ? pois.groups.reduce((n, group) => n + (poiGroups[group.id] === true ? 1 : 0), 0)
    : 0

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-sm font-medium">Layers</h2>
        {pois ? (
          <span className="text-xs text-neutral-400">
            {enabledCount} of {pois.groups.length} groups
          </span>
        ) : null}
      </div>

      {pois === null ? (
        <div className="mt-2 px-1">
          <p className="text-xs text-neutral-400">
            No data/pois.json. Generate it with .venv/bin/python scripts/fetch-pois.py (local
            only).
          </p>
          {poisError ? <p className="mt-2 text-xs text-amber-400">{poisError}</p> : null}
        </div>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {pois.groups.map((group) => {
              const on = poiGroups[group.id] === true
              const total = counts?.byGroup.get(group.id) ?? 0
              const checkable = on
                ? group.types.filter((type) => isPoiCheckable(type.id, group.id))
                : []
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => togglePoiGroup(group.id)}
                    className={`inline-flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium ${
                      on ? chipOn : chipOff
                    }`}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: poiGroupColor(group.id) }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>
                    <span className="shrink-0 tabular-nums text-xs opacity-80">
                      {formatCount(total)}
                    </span>
                  </button>
                  {checkable.length > 0 ? (
                    <ul className="mt-0.5 space-y-0.5 px-3">
                      {checkable.map((type) => (
                        <li
                          key={type.id}
                          className="flex items-center justify-between gap-2 text-xs text-neutral-400"
                        >
                          <span className="min-w-0 truncate">{type.label}</span>
                          <span className="shrink-0 tabular-nums">
                            {collectedByType.get(type.id) ?? 0}/{counts?.byType.get(type.id) ?? 0}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            })}
          </ul>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                for (const group of pois.groups) setPoiGroup(group.id, false)
              }}
            >
              All off
            </button>
            <button
              type="button"
              className={btnClass}
              onClick={() => {
                for (const group of pois.groups) {
                  setPoiGroup(group.id, poiGroupDefault(group.id, group.defaultOn))
                }
              }}
            >
              Defaults
            </button>
          </div>
        </>
      )}
    </div>
  )
}
