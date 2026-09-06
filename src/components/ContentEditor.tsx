import { useMemo, useRef, useState } from 'react'
import { loadContent } from '../content/loader'
import type { EntityType } from '../content/ids'
import { ContentFileSchema } from '../content/schema'
import { buildSearchIndex } from '../content/search'
import {
  applySaveDefaults,
  downloadContentFile,
  emptyRecord,
  fetchContentFile,
  fieldSpecs,
  saveContentDev,
  upsertRecord,
  validateContentFile,
} from '../lib/content-io'
import type { ContentFileInput } from '../content/types'
import { useAppStore } from '../store'
import { FieldControl } from './content-editor/FieldControl'
import { getPath, isRecord, setPath } from './content-editor/paths'
import { RecordHeader } from './content-editor/RecordHeader'
import { btnClass } from './content-editor/ui'

function todayLocal(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

function issueLines(value: unknown): string[] {
  const result = ContentFileSchema.safeParse(value)
  if (result.success) return []
  return result.error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message
  })
}

function emptyFile(type: EntityType): ContentFileInput {
  return { version: 1, type, records: [] }
}

function applyPicked(
  draft: Record<string, unknown>,
  picked: { target: string; x: number; y: number } | null,
): Record<string, unknown> {
  if (picked === null) return draft
  const existing = getPath(draft, picked.target)
  const map =
    isRecord(existing) && (existing.map === 'pywel' || existing.map === 'abyss')
      ? existing.map
      : 'pywel'
  return setPath(draft, picked.target, { map, x: picked.x, y: picked.y })
}

function recordFromFile(
  file: ContentFileInput,
  type: EntityType,
  id: string,
): Record<string, unknown> {
  const record = file.records.find((item) => item.id === id)
  return record ? { ...record } : emptyRecord(type)
}

export default function ContentEditor() {
  const content = useAppStore((s) => s.content)
  const setContent = useAppStore((s) => s.setContent)
  const picked = useAppStore((s) => s.editor.picked)
  const clearPick = useAppStore((s) => s.clearPick)
  const [type, setType] = useState<EntityType>('quest')
  const [selectedId, setSelectedId] = useState('new')
  const [draft, setDraft] = useState<Record<string, unknown>>(() => emptyRecord('quest'))
  const [idTouched, setIdTouched] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jsonErrors, setJsonErrors] = useState<Record<string, string>>({})
  const [formKey, setFormKey] = useState(0)
  const loadGen = useRef(0)

  const index = useMemo(() => buildSearchIndex(content, [], []), [content])
  const gameVersion = content.meta?.game.version ?? ''
  const today = todayLocal()
  const records = content.byType[type]
  const jsonBlocked = Object.values(jsonErrors).some((message) => message.length > 0)
  const shownDraft = applyPicked(draft, picked)
  const preview = {
    version: 1 as const,
    type,
    records: [applySaveDefaults(shownDraft, gameVersion, today)],
  }
  const issues = validateContentFile(preview).ok ? [] : issueLines(preview)

  function nextLoad() {
    loadGen.current += 1
    return loadGen.current
  }

  function resetSeed(next: Record<string, unknown>, nextIdTouched = false) {
    setDraft(next)
    setIdTouched(nextIdTouched)
    setDirty(false)
    setJsonErrors({})
    setFormKey((n) => n + 1)
  }

  async function loadFile(): Promise<ContentFileInput> {
    try {
      return await fetchContentFile(type)
    } catch {
      return emptyFile(type)
    }
  }

  function takePick(base: Record<string, unknown>): Record<string, unknown> {
    const current = useAppStore.getState().editor.picked
    if (current === null) return base
    clearPick()
    return applyPicked(base, current)
  }

  function patch(path: string, value: unknown) {
    // Read and clear the pick here, not inside the updater: updaters run during
    // render (twice under StrictMode), so a store write there is a React error
    // and the second run would see the pick already cleared.
    const pick = useAppStore.getState().editor.picked
    if (pick !== null) clearPick()
    setDraft((current) => setPath(applyPicked(current, pick), path, value))
    setDirty(true)
  }

  function changeType(next: EntityType) {
    nextLoad()
    clearPick()
    setNotice(null)
    setError(null)
    setType(next)
    setSelectedId('new')
    resetSeed(emptyRecord(next))
  }

  function changeRecord(id: string) {
    const token = nextLoad()
    clearPick()
    setNotice(null)
    setError(null)
    if (id === 'new') {
      setSelectedId('new')
      resetSeed(emptyRecord(type))
      return
    }
    setSelectedId(id)
    void loadFile()
      .then((file) => {
        if (token !== loadGen.current) return
        resetSeed(recordFromFile(file, type, id), true)
      })
      .catch(() => {
        if (token !== loadGen.current) return
        resetSeed(emptyRecord(type))
      })
  }

  async function onSave() {
    setNotice(null)
    setError(null)
    const merged = takePick(draft)
    if (merged !== draft) {
      setDraft(merged)
      setDirty(true)
    }
    const prepared = applySaveDefaults(merged, gameVersion, today)
    const next = upsertRecord(await loadFile(), prepared)
    const checked = validateContentFile(next, `${type}.json`)
    if (!checked.ok) {
      setError(checked.message)
      return
    }
    const saved = await saveContentDev(type, next)
    if (saved.ok) {
      setNotice(`Saved to data/content/${type}.json`)
      const result = await loadContent()
      setContent(result.db, result.error)
      if (typeof prepared.id === 'string' && prepared.id !== '') setSelectedId(prepared.id)
      resetSeed(prepared, true)
      return
    }
    downloadContentFile(type, next)
    setNotice(`Downloaded ${type}.json, copy it to data/content/`)
  }

  async function onDownload() {
    const merged = takePick(draft)
    if (merged !== draft) {
      setDraft(merged)
      setDirty(true)
    }
    downloadContentFile(type, upsertRecord(await loadFile(), applySaveDefaults(merged, gameVersion, today)))
  }

  function onRevert() {
    const token = nextLoad()
    clearPick()
    setNotice(null)
    setError(null)
    if (selectedId === 'new') {
      resetSeed(emptyRecord(type))
      return
    }
    void loadFile().then((file) => {
      if (token !== loadGen.current) return
      resetSeed(recordFromFile(file, type, selectedId), true)
    })
  }

  const specs = fieldSpecs(type).filter((spec) => spec.key !== 'id' && spec.key !== 'type')
  const skipName = selectedId === 'new'
  const ordered = [
    ...specs.filter((spec) => spec.key === 'name' && !skipName),
    ...specs.filter((spec) => spec.key === 'summary'),
    ...specs.filter((spec) => spec.key !== 'name' && spec.key !== 'summary'),
  ]

  return (
    <div className="space-y-2">
      <RecordHeader
        type={type}
        selectedId={selectedId}
        records={records}
        draft={shownDraft}
        idTouched={idTouched}
        onType={changeType}
        onSelect={changeRecord}
        onName={(next) => {
          setDraft(takePick(next))
          setDirty(true)
        }}
        onId={(id) => {
          setIdTouched(true)
          patch('id', id)
        }}
      />

      {ordered.map((spec) => (
        <FieldControl
          key={`${formKey}:${spec.key}`}
          spec={spec}
          path={spec.key}
          value={shownDraft[spec.key]}
          index={index}
          jsonError={jsonErrors[spec.key] ?? null}
          onChange={(value) => patch(spec.key, value)}
          onJsonError={(message) =>
            setJsonErrors((current) => {
              const next = { ...current }
              if (message === null) delete next[spec.key]
              else next[spec.key] = message
              return next
            })
          }
        />
      ))}

      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          onClick={() => void onSave()}
          disabled={issues.length > 0 || jsonBlocked}
          className={btnClass}
        >
          Save
        </button>
        <button type="button" onClick={() => void onDownload()} className={btnClass}>
          Download
        </button>
        <button type="button" onClick={onRevert} className={btnClass}>
          Revert
        </button>
      </div>
      {dirty || picked !== null ? (
        <p className="px-1 text-xs font-medium text-amber-400">Unsaved changes</p>
      ) : null}
      {notice ? <p className="px-1 text-xs text-neutral-300">{notice}</p> : null}
      {error ? <p className="px-1 text-xs text-red-400">{error}</p> : null}
      {issues.length > 0 ? (
        <ul className="space-y-1 px-1 text-xs text-red-400">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
