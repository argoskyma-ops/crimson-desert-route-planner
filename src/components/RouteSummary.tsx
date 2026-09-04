import { CLASS_COLORS, CLASS_LABELS, METERS_PER_PIXEL } from '../config/travel'
import { ROAD_CLASSES, type RoadClass, type Route } from '../routing/types'
import { useAppStore } from '../store'

function pxToKm(lengthPx: number): number {
  return (lengthPx * METERS_PER_PIXEL) / 1000
}

function formatEta(totalSeconds: number): string {
  const total = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  const ss = String(seconds).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${ss}`
  }
  return `${minutes}:${ss}`
}

function classBreakdown(route: Route): { cls: RoadClass; km: number }[] {
  const px: Partial<Record<RoadClass, number>> = {}
  for (const leg of route.legs) {
    px[leg.class] = (px[leg.class] ?? 0) + leg.lengthPx
  }
  return ROAD_CLASSES.filter((cls) => (px[cls] ?? 0) > 0).map((cls) => ({
    cls,
    km: pxToKm(px[cls] ?? 0),
  }))
}

export default function RouteSummary() {
  const pins = useAppStore((s) => s.pins)
  const route = useAppStore((s) => s.route)

  const pinCount = (pins.a !== null ? 1 : 0) + (pins.b !== null ? 1 : 0)
  if (pinCount === 0) return null
  if (pinCount === 1) {
    return <p className="mt-3 px-1 text-xs text-neutral-400">Place pin B</p>
  }
  if (!route) return null

  const totalKm = pxToKm(route.totalPx)
  const breakdown = classBreakdown(route)

  return (
    <div className="mt-3 px-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium tabular-nums">{totalKm.toFixed(1)} km</span>
        <span className="tabular-nums text-neutral-300">{formatEta(route.totalSeconds)}</span>
      </div>
      {breakdown.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {breakdown.map(({ cls, km }) => (
            <li key={cls} className="flex items-center gap-2 text-xs text-neutral-300">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: CLASS_COLORS[cls] }}
                aria-hidden
              />
              <span>{CLASS_LABELS[cls]}</span>
              <span className="ml-auto tabular-nums">{km.toFixed(1)} km</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
