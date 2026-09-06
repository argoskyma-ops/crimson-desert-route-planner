import type { ContentLocation, Step } from '../content/types'
import { toLatLng } from '../lib/coords'
import { mapRef, useAppStore } from '../store'
import EntityLink from './entity/EntityLink'
import { Badge, PanelButton } from './entity/Section'

const SHOW_ZOOM = 5

function MissableLine({ step }: { step: Step }) {
  if (step.missable === 'easy-to-miss') {
    return <p className="text-xs text-amber-300">Easy to miss</p>
  }
  if (step.missable === 'lost-if') {
    return <p className="text-xs text-red-400">Lost if: {step.missableNote}</p>
  }
  return null
}

function showOnMap(location: ContentLocation, setHighlight: (loc: ContentLocation) => void) {
  setHighlight(location)
  if (location.map !== 'pywel') return
  const map = mapRef.current
  if (!map) return
  map.setView(toLatLng(location), Math.max(map.getZoom(), SHOW_ZOOM))
}

export default function GuideSteps({
  entityId,
  steps,
  keyFor,
}: {
  entityId: string
  steps: readonly Step[]
  keyFor: (index: number) => string
}) {
  const progress = useAppStore((s) => s.progress)
  const pinA = useAppStore((s) => s.pins.a)
  const setPin = useAppStore((s) => s.setPin)
  const setHighlight = useAppStore((s) => s.setHighlight)
  const toggleStepDone = useAppStore((s) => s.toggleStepDone)

  if (steps.length === 0) return null

  return (
    <ol id={`${entityId}-guide-steps`} className="space-y-2">
      {steps.map((step, index) => {
        const key = keyFor(index)
        const done = progress.steps.includes(key)
        const location = step.location
        const onPywel = location !== undefined && location.map === 'pywel'
        return (
          <li key={key} className="text-sm">
            <label className="flex min-h-11 items-start gap-2">
              <input
                type="checkbox"
                className="mt-3"
                checked={done}
                onChange={() => toggleStepDone(key)}
              />
              <span
                className={`min-w-0 flex-1 ${done ? 'line-through text-neutral-500' : 'text-neutral-100'}`}
              >
                {step.text}
              </span>
            </label>
            <div className="mt-1 ml-6 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                {step.action ? <Badge>{step.action}</Badge> : null}
                {step.cost ? (
                  <span className="text-xs text-neutral-400">
                    {step.cost.amount} {step.cost.currency}
                  </span>
                ) : null}
                {step.optional ? <Badge>optional</Badge> : null}
              </div>
              <MissableLine step={step} />
              {step.refs?.length ? (
                <ul className="space-y-0.5">
                  {step.refs.map((id) => (
                    <li key={id}>
                      <EntityLink id={id} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {location ? (
                <div className="flex flex-wrap items-center gap-2">
                  {onPywel ? (
                    <>
                      <PanelButton onClick={() => setPin('b', { x: location.x, y: location.y })}>
                        Route here
                      </PanelButton>
                      {pinA === null ? (
                        <span className="text-xs text-neutral-400">Tap the map where you are</span>
                      ) : null}
                    </>
                  ) : null}
                  <PanelButton
                    disabled={!onPywel}
                    title={onPywel ? undefined : 'This location is not on the Pywel map'}
                    onClick={() => showOnMap(location, setHighlight)}
                  >
                    Show
                  </PanelButton>
                </div>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
