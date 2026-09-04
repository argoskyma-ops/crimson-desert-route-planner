import { MODE_LABELS } from '../config/travel'
import { MODES } from '../routing/types'
import { useAppStore } from '../store'
import RouteSummary from './RouteSummary'

export default function ControlPanel() {
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const pins = useAppStore((s) => s.pins)
  const clearPins = useAppStore((s) => s.clearPins)
  const roadsError = useAppStore((s) => s.roadsError)

  const hasPins = pins.a !== null || pins.b !== null
  const bothPlaced = pins.a !== null && pins.b !== null
  const noPins = pins.a === null && pins.b === null

  return (
    <aside
      className="pointer-events-auto absolute top-3 left-3 z-[1100] w-[calc(100%-1.5rem)] max-w-[320px] rounded-xl border border-white/10 bg-neutral-950/80 p-3 text-neutral-100 shadow-lg backdrop-blur-md max-[479px]:inset-x-0 max-[479px]:top-0 max-[479px]:w-full max-[479px]:max-w-none max-[479px]:rounded-none max-[479px]:pt-[calc(0.75rem+env(safe-area-inset-top))]"
    >
      <h1 className="px-1 text-sm font-semibold tracking-tight">
        Crimson Desert Route Planner
      </h1>

      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg bg-neutral-800/90 p-1">
        {MODES.map((m) => {
          const selected = mode === m
          return (
            <button
              key={m}
              type="button"
              aria-pressed={selected}
              onClick={() => setMode(m)}
              className={`inline-flex min-h-11 items-center justify-center rounded-md px-3 text-sm font-medium ${
                selected
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-300 hover:bg-neutral-700/70'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={clearPins}
        disabled={!hasPins}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-neutral-800/80 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-800/80"
      >
        Clear
      </button>

      {noPins ? (
        <p className="mt-3 px-1 text-xs text-neutral-400">Tap the map to place A, then B</p>
      ) : bothPlaced ? (
        <p className="mt-3 px-1 text-xs text-neutral-400">Drag pins to move them</p>
      ) : null}

      {roadsError ? (
        <p className="mt-3 px-1 text-xs text-amber-400">{roadsError}</p>
      ) : null}

      <RouteSummary />
    </aside>
  )
}
