import { MAPS } from '../../content/schema'
import { useAppStore } from '../../store'
import { isRecord } from './paths'
import { FieldLabel } from './SimpleFields'
import { btnClass, inputClass } from './ui'

function coord(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(1) : '—'
}

export function LocationField({
  label,
  path,
  value,
  onChange,
}: {
  label: string
  path: string
  value: unknown
  onChange: (value: { map: string; x: number; y: number } | undefined) => void
}) {
  const pickTarget = useAppStore((s) => s.editor.pickTarget)
  const armPick = useAppStore((s) => s.armPick)
  const loc = isRecord(value) ? value : null
  const map = loc && typeof loc.map === 'string' ? loc.map : 'pywel'
  const armed = pickTarget === path

  return (
    <div>
      <FieldLabel label={label} />
      <div className="grid grid-cols-2 gap-1">
        <p className={`${inputClass} flex items-center text-neutral-300`}>x {coord(loc?.x)}</p>
        <p className={`${inputClass} flex items-center text-neutral-300`}>y {coord(loc?.y)}</p>
      </div>
      <select
        value={map}
        onChange={(event) => {
          if (!loc || typeof loc.x !== 'number' || typeof loc.y !== 'number') return
          onChange({ map: event.target.value, x: loc.x, y: loc.y })
        }}
        className={`${inputClass} mt-1`}
      >
        {MAPS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <div className="mt-1 grid grid-cols-2 gap-1">
        <button type="button" onClick={() => armPick(path)} className={btnClass}>
          {armed ? 'Tap the map…' : 'Pick on map'}
        </button>
        <button type="button" onClick={() => onChange(undefined)} className={btnClass}>
          Clear
        </button>
      </div>
    </div>
  )
}
