import { inputClass, labelClass } from './ui'
import type { FieldSpec } from '../../lib/content-io'

export function FieldLabel({ label }: { label: string }) {
  return <label className={labelClass}>{label}</label>
}

export function TextField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: unknown
  onChange: (value: string) => void
  multiline?: boolean
}) {
  const text = typeof value === 'string' ? value : ''
  if (multiline) {
    return (
      <div>
        <FieldLabel label={label} />
        <textarea
          value={text}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className={`${inputClass} min-h-24 py-2`}
        />
      </div>
    )
  }
  return (
    <div>
      <FieldLabel label={label} />
      <input
        type="text"
        value={text}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  )
}

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (value: number | undefined) => void
}) {
  return (
    <div>
      <FieldLabel label={label} />
      <input
        type="number"
        value={typeof value === 'number' && Number.isFinite(value) ? value : ''}
        onChange={(event) => {
          const raw = event.target.value
          if (raw === '') {
            onChange(undefined)
            return
          }
          const next = Number(raw)
          onChange(Number.isFinite(next) ? next : undefined)
        }}
        className={inputClass}
      />
    </div>
  )
}

export function BooleanField({
  label,
  value,
  onChange,
}: {
  label: string
  value: unknown
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm text-neutral-100">
      <input
        type="checkbox"
        checked={value === true}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  )
}

export function EnumField({
  spec,
  value,
  onChange,
}: {
  spec: FieldSpec
  value: unknown
  onChange: (value: string | undefined) => void
}) {
  const options = spec.options ?? []
  return (
    <div>
      <FieldLabel label={spec.key} />
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
        className={inputClass}
      >
        {spec.required ? null : <option value="">—</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}
