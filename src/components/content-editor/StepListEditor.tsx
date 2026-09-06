import { CURRENCIES, MISSABLE_LEVELS, STEP_ACTIONS } from '../../content/schema'
import type { SearchIndex } from '../../content/search'
import { IdListEditor } from './IdPicker'
import { LocationField } from './LocationField'
import { isRecord } from './paths'
import { FieldLabel } from './SimpleFields'
import { btnClass, inputClass } from './ui'

function asSteps(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => (isRecord(item) ? { ...item } : { text: '' }))
}

export function StepListEditor({
  path,
  value,
  index,
  onChange,
}: {
  path: string
  value: unknown
  index: SearchIndex
  onChange: (value: Record<string, unknown>[]) => void
}) {
  const steps = asSteps(value)

  function update(i: number, patch: Record<string, unknown>) {
    onChange(steps.map((step, idx) => (idx === i ? { ...step, ...patch } : step)))
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= steps.length) return
    const next = steps.slice()
    const swap = next[i]
    const other = next[j]
    if (swap === undefined || other === undefined) return
    next[i] = other
    next[j] = swap
    onChange(next)
  }

  return (
    <div>
      <FieldLabel label={path} />
      <div className="space-y-2">
        {steps.map((step, i) => {
          const cost = isRecord(step.cost) ? step.cost : null
          return (
            <div key={i} className="space-y-1 rounded-lg border border-white/10 bg-neutral-900/60 p-2">
              <textarea
                value={typeof step.text === 'string' ? step.text : ''}
                onChange={(event) => update(i, { text: event.target.value })}
                rows={3}
                className={`${inputClass} min-h-20 py-2`}
              />
              <select
                value={typeof step.action === 'string' ? step.action : ''}
                onChange={(event) =>
                  update(i, { action: event.target.value === '' ? undefined : event.target.value })
                }
                className={inputClass}
              >
                <option value="">action</option>
                {STEP_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
              <select
                value={typeof step.missable === 'string' ? step.missable : ''}
                onChange={(event) =>
                  update(i, { missable: event.target.value === '' ? undefined : event.target.value })
                }
                className={inputClass}
              >
                <option value="">missable</option>
                {MISSABLE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              {step.missable === 'lost-if' ? (
                <input
                  type="text"
                  value={typeof step.missableNote === 'string' ? step.missableNote : ''}
                  onChange={(event) => update(i, { missableNote: event.target.value })}
                  placeholder="missableNote"
                  className={inputClass}
                />
              ) : null}
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={step.optional === true}
                  onChange={(event) => update(i, { optional: event.target.checked })}
                />
                optional
              </label>
              <div className="grid grid-cols-2 gap-1">
                <select
                  value={typeof cost?.currency === 'string' ? cost.currency : ''}
                  onChange={(event) => {
                    const currency = event.target.value
                    if (currency === '') {
                      update(i, { cost: undefined })
                      return
                    }
                    const amount = typeof cost?.amount === 'number' ? cost.amount : 0
                    update(i, { cost: { currency, amount } })
                  }}
                  className={inputClass}
                >
                  <option value="">currency</option>
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={typeof cost?.amount === 'number' ? cost.amount : ''}
                  onChange={(event) => {
                    if (!cost || typeof cost.currency !== 'string') return
                    const amount = event.target.value === '' ? 0 : Number(event.target.value)
                    update(i, { cost: { currency: cost.currency, amount } })
                  }}
                  className={inputClass}
                />
              </div>
              <LocationField
                label="location"
                path={`${path}.${i}.location`}
                value={step.location}
                onChange={(location) => update(i, { location })}
              />
              <IdListEditor
                label="refs"
                value={step.refs}
                entityType="any"
                index={index}
                onChange={(refs) => update(i, { refs })}
              />
              <div className="grid grid-cols-3 gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className={btnClass}>
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                  className={btnClass}
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => onChange(steps.filter((_, idx) => idx !== i))}
                  className={btnClass}
                >
                  Remove
                </button>
              </div>
            </div>
          )
        })}
        <button type="button" onClick={() => onChange([...steps, { text: '' }])} className={btnClass}>
          Add step
        </button>
      </div>
    </div>
  )
}
