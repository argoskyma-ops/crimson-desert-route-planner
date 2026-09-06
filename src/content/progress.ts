/**
 * Companion progress in localStorage (docs/DECISIONS.md D16).
 * Pure TypeScript; storage is injected so tests run in Node. No DOM imports.
 */
export const PROGRESS_KEY = 'cd-companion:progress:v1'
export const PROGRESS_VERSION = 1

export interface Progress {
  version: 1
  steps: string[]
  quests: string[]
  collected: string[]
}

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export function emptyProgress(): Progress {
  return { version: PROGRESS_VERSION, steps: [], quests: [], collected: [] }
}

export function stepKey(entityId: string, index: number): string {
  return `${entityId}#g${index}`
}

export function acquisitionStepKey(
  entityId: string,
  acquisition: number,
  step: number,
): string {
  return `${entityId}#a${acquisition}s${step}`
}

function defaultStorage(): StorageLike | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return globalThis.localStorage
  } catch {
    return null
  }
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  return storage === undefined ? defaultStorage() : storage
}

function uniqueStrings(name: string, value: unknown): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Progress file is missing ${name}`)
  }
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new Error(`Progress ${name} must contain only strings`)
    }
    if (seen.has(item)) continue
    seen.add(item)
    out.push(item)
  }
  return out
}

export function parseProgress(json: string): Progress {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    throw new Error('Progress file is not valid JSON')
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Progress file is not an object')
  }
  const record = data as Record<string, unknown>
  if (record.version !== PROGRESS_VERSION) {
    throw new Error(
      `Progress file is version ${String(record.version)}; this app reads version ${PROGRESS_VERSION}`,
    )
  }
  return {
    version: PROGRESS_VERSION,
    steps: uniqueStrings('steps', record.steps),
    quests: uniqueStrings('quests', record.quests),
    collected: uniqueStrings('collected', record.collected),
  }
}

export function loadProgress(storage?: StorageLike | null): Progress {
  const store = resolveStorage(storage)
  if (store === null) return emptyProgress()
  try {
    const raw = store.getItem(PROGRESS_KEY)
    if (raw === null) return emptyProgress()
    return parseProgress(raw)
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress: Progress, storage?: StorageLike | null): void {
  const store = resolveStorage(storage)
  if (store === null) return
  try {
    store.setItem(PROGRESS_KEY, JSON.stringify(progress))
  } catch {
    // Quota or private-mode write failures must not surface.
  }
}

function toggleList(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id]
}

export function toggleStep(progress: Progress, key: string): Progress {
  return { ...progress, steps: toggleList(progress.steps, key) }
}

export function toggleQuest(progress: Progress, id: string): Progress {
  return { ...progress, quests: toggleList(progress.quests, id) }
}

export function toggleCollected(progress: Progress, id: string): Progress {
  return { ...progress, collected: toggleList(progress.collected, id) }
}

export function exportProgress(progress: Progress): string {
  return JSON.stringify(
    {
      version: PROGRESS_VERSION,
      steps: [...progress.steps].sort(),
      quests: [...progress.quests].sort(),
      collected: [...progress.collected].sort(),
    },
    null,
    2,
  )
}

export function importProgress(json: string): Progress {
  return parseProgress(json)
}
