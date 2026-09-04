import {
  FAST_TRAVEL_COLORS,
  FAST_TRAVEL_LABELS,
  FAST_TRAVEL_SHORT_LABELS,
  FAST_TRAVEL_TYPES,
} from '../config/travel'
import { toLatLng } from '../lib/coords'
import { searchFastTravel } from '../lib/fast-travel-loader'
import { mapRef, useAppStore } from '../store'

const RESULT_LIMIT = 8
const FOCUS_ZOOM = 5

export default function FastTravelSearch() {
  const locations = useAppStore((s) => s.fastTravel)
  const enabled = useAppStore((s) => s.fastTravelTypes)
  const query = useAppStore((s) => s.fastTravelQuery)
  const setQuery = useAppStore((s) => s.setFastTravelQuery)
  const toggleType = useAppStore((s) => s.toggleFastTravelType)
  const focusFastTravel = useAppStore((s) => s.focusFastTravel)

  const matches = searchFastTravel(locations, query)
  const hits = matches.slice(0, RESULT_LIMIT)
  const totalHits = matches.length

  const goTo = (id: string) => {
    const loc = locations.find((item) => item.id === id)
    if (!loc) return
    focusFastTravel(id)
    const map = mapRef.current
    if (!map) return
    map.setView(toLatLng(loc), Math.max(map.getZoom(), FOCUS_ZOOM))
  }

  return (
    <div className="mt-3">
      <label className="sr-only" htmlFor="fast-travel-search">
        Search locations
      </label>
      <input
        id="fast-travel-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || hits.length === 0) return
          event.preventDefault()
          goTo(hits[0].id)
        }}
        placeholder="Search camps, villages…"
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
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-xs text-neutral-400">No matching locations</li>
          ) : (
            hits.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  onClick={() => goTo(loc.id)}
                  className="flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm hover:bg-neutral-800/90"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: FAST_TRAVEL_COLORS[loc.type] }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">{loc.name}</span>
                  <span className="shrink-0 text-xs text-neutral-400">
                    {FAST_TRAVEL_LABELS[loc.type]}
                  </span>
                </button>
              </li>
            ))
          )}
          {totalHits > hits.length ? (
            <li className="px-3 py-2 text-xs text-neutral-500">
              {totalHits - hits.length} more — type more to narrow
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
