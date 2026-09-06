import { useState } from 'react'
import { FieldLabel } from './SimpleFields'
import { inputClass } from './ui'

function encode(value: unknown): string {
  if (value === undefined || value === null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

export function JsonField({
  label,
  value,
  onChange,
  error,
  onError,
}: {
  label: string
  value: unknown
  onChange: (value: unknown) => void
  error: string | null
  onError: (message: string | null) => void
}) {
  const [text, setText] = useState(() => encode(value))

  function parse(raw: string, commit: boolean) {
    const trimmed = raw.trim()
    if (trimmed === '') {
      onError(null)
      if (commit) onChange(undefined)
      return
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      onError(null)
      if (commit) onChange(parsed)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'invalid JSON')
    }
  }

  return (
    <div>
      <FieldLabel label={label} />
      <textarea
        value={text}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          parse(next, false)
        }}
        onBlur={() => parse(text, true)}
        rows={6}
        spellCheck={false}
        className={`${inputClass} min-h-32 py-2 font-mono text-xs`}
      />
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
