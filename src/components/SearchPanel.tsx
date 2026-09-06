import { useMemo } from 'react'
import {
  FAST_TRAVEL_COLORS,
  FAST_TRAVEL_LABELS,
  FAST_TRAVEL_SHORT_LABELS,
  FAST_TRAVEL_TYPES,
  type FastTravelType,
} from '../config/travel'
import { buildSearchIndex, search, topHit, type SearchHit } from '../content/search'
import { isEntityType } from '../content/ids'
import { ENTITY_LABELS } from '../content/types'
import { toLatLng } from '../lib/coords'
import { mapRef, useAppStore } from '../store'

const RESULT_LIMIT = 20
const COUNT_LIMIT = 200
const FOCUS_ZOOM = 5

function isFastTravelType(type: string): type is FastTravelType {
  return (FAST_TRAVEL_TYPES as readonly string[]).includes(type)
}

function hitTypeLabel(hit: SearchHit): string {
  if (hit.kind === 'entity' && isEntityType(hit.type)) return ENTITY_LABELS[hit.type]
  if (hit.kind === 'place' && isFastTravelType(hit.type)) return FAST_TRAVEL_LABELS[hit.type]
  if (hit.type.length === 0) return hit.type
  return hit.type[0].toUpperCase() + hit.type.slice(1)
}

function hitCount(groups: { hits: SearchHit[] }[]): number {
  return groups.reduce((n, group) => n + group.hits.length, 0)
}

export default function SearchPanel() {
  const content = useAppStore((s) => s.content)
  const fastTravel = useAppStore((s) => s.fastTravel)
  const enabled = useAppStore((s) => s.fastTravelTypes)
  const query = useAppStore((s) => s.fastTravelQuery)
  const setQuery = useAppStore((s) => s.setFastTravelQuery)
  const toggleType = useAppStore((s) => s.toggleFastTravelType)
  const focusFastTravel = useAppStore((s) => s.focusFastTravel)
  const selectEntity = useAppStore((s) => s.selectEntity)

  const index = useMemo(
    () => buildSearchIndex(content, fastTravel, []),
    [content, fastTravel],
  )
  const groups = useMemo(() => search(index, query, RESULT_LIMIT), [index, query])
  const totalHits = useMemo(() => {
    if (query.trim().length === 0) return 0
    return hitCount(search(index, query, COUNT_LIMIT))
  }, [index, query])
  const shownHits = hitCount(groups)
  const more = totalHits - shownHits

  const openHit = (hit: SearchHit) => {
    if (hit.kind === 'entity') {
      selectEntity(hit.ref)
      const location = content.byId.get(hit.ref)?.location
      if (location?.map !== 'pywel') return
      const map = mapRef.current
      if (!map) return
      map.setView(toLatLng(location), Math.max(map.getZoom(), FOCUS_ZOOM))
      return
    }
    if (hit.kind === 'place') {
      const loc = fastTravel.find((item) => item.id === hit.ref)
      if (!loc) return
      focusFastTravel(hit.ref)
      const map = mapRef.current
      if (!map) return
      map.setView(toLatLng(loc), Math.max(map.getZoom(), FOCUS_ZOOM))
      return
    }
    // T16 wires turning the POI group on and panning to the nearest node.
  }

  return (
    <div className="mt-3">
      <label className="sr-only" htmlFor="global-search">
        Search quests, items, places
      </label>
      <input
        id="global-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          const hit = topHit(groups)
          if (hit === null) return
          event.preventDefault()
          openHit(hit)
        }}
        placeholder="Search quests, items, places…"
        className="min-h-11 w-full rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-white/30"
      />

      <div className="mt-2 grid grid-cols-4 gap-1">
        {FAST_TRAVEL_TYPES.map((type) => {
          const on = enabled[type]
          return (
            <button
              key={type}
              type="button"
              aria-pressed={on}
              onClick={() => toggleType(type)}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-medium ${
                on
                  ? 'border-white/20 bg-neutral-100 text-neutral-900'
                  : 'border-white/10 bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700/80'
              }`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: FAST_TRAVEL_COLORS[type] }}
                aria-hidden
              />
              {FAST_TRAVEL_SHORT_LABELS[type]}
            </button>
          )
        })}
      </div>

      {query.trim().length > 0 ? (
        <ul className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-neutral-900/90">
          {groups.length === 0 ? (
            <li className="px-3 py-2 text-xs text-neutral-400">No matching results</li>
          ) : (
            groups.map((group) => (
              <li key={group.type}>
                <div className="flex items-center justify-between px-3 pt-2 text-xs text-neutral-500">
                  <span>{group.label}</span>
                  <span>{group.hits.length}</span>
                </div>
                <ul>
                  {group.hits.map((hit) => (
                    <li key={`${hit.kind}|${hit.ref}`}>
                      <button
                        type="button"
                        onClick={() => openHit(hit)}
                        className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-neutral-800/90"
                      >
                        {hit.kind === 'place' && isFastTravelType(hit.type) ? (
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: FAST_TRAVEL_COLORS[hit.type] }}
                            aria-hidden
                          />
                        ) : null}
                        <span className="min-w-0 flex-1 truncate">{hit.name}</span>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {hitTypeLabel(hit)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}
          {more > 0 ? (
            <li className="px-3 py-2 text-xs text-neutral-500">
              {more} more, type more to narrow
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
