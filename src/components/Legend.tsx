import {
  CLASS_COLORS,
  CLASS_LABELS,
  FAST_TRAVEL_COLORS,
  FAST_TRAVEL_LABELS,
  FAST_TRAVEL_TYPES,
} from '../config/travel'
import { ROAD_CLASSES } from '../routing/types'
import { useAppStore } from '../store'

export default function Legend() {
  const showRoads = useAppStore((s) => s.showRoads)
  const toggleShowRoads = useAppStore((s) => s.toggleShowRoads)
  const fastTravelTypes = useAppStore((s) => s.fastTravelTypes)

  return (
    <div
      className="pointer-events-auto absolute bottom-3 left-3 z-[1100] rounded-xl border border-white/10 bg-neutral-950/80 px-3 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] text-neutral-100 shadow-lg backdrop-blur-md"
      aria-label="Map legend"
    >
      <ul className="space-y-1">
        {FAST_TRAVEL_TYPES.filter((type) => fastTravelTypes[type]).map((type) => (
          <li key={type} className="flex items-center gap-2 text-xs text-neutral-200">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: FAST_TRAVEL_COLORS[type] }}
              aria-hidden
            />
            {FAST_TRAVEL_LABELS[type]}
          </li>
        ))}
        {ROAD_CLASSES.map((cls) => (
          <li key={cls} className="flex items-center gap-2 text-xs text-neutral-200">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: CLASS_COLORS[cls] }}
              aria-hidden
            />
            {CLASS_LABELS[cls]}
          </li>
        ))}
      </ul>
      <label className="mt-1 flex min-h-11 cursor-pointer items-center gap-2 text-xs font-medium text-neutral-100">
        <input
          type="checkbox"
          checked={showRoads}
          onChange={() => toggleShowRoads()}
          className="h-4 w-4 accent-neutral-100"
        />
        Show roads
      </label>
    </div>
  )
}
