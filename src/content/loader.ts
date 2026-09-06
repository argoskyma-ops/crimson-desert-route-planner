/**
 * Fetch and validate data/content/ (docs/DECISIONS.md D12, D16).
 * A missing or invalid file is skipped; the db is never null.
 */
import { buildContentDb, emptyContentDb, type ContentDb } from './db.ts'
import { parseContentFile, parseMeta } from './schema.ts'
import type { ContentFile, ContentMeta } from './types.ts'

export interface LoadContentResult {
  db: ContentDb
  /** Set when meta.json is missing or invalid; the db is then empty. */
  error: string | null
  /** File names listed in meta.json that were missing or invalid and were skipped. */
  skipped: string[]
}

export const CONTENT_BASE = '/data/content/'

export async function loadContent(fetchImpl: typeof fetch = fetch): Promise<LoadContentResult> {
  try {
    return await loadContentInner(fetchImpl)
  } catch (e) {
    return failMeta(e instanceof Error ? e.message : 'content load failed')
  }
}

async function loadContentInner(fetchImpl: typeof fetch): Promise<LoadContentResult> {
  const metaResult = await fetchJson(fetchImpl, `${CONTENT_BASE}meta.json`)
  if (!metaResult.ok) return failMeta(`meta.json: ${metaResult.reason}`)

  let meta: ContentMeta
  try {
    meta = parseMeta(metaResult.data)
  } catch (e) {
    return failMeta(e instanceof Error ? e.message : 'meta.json is invalid')
  }

  const outcomes = await Promise.all(meta.files.map((name) => loadListedFile(fetchImpl, name)))
  const parsed: ContentFile[] = []
  const skipped: string[] = []
  const seenIds = new Set<string>()

  for (const outcome of outcomes) {
    if (!outcome.ok) {
      console.warn(`content: ${outcome.name}: ${outcome.reason}`)
      skipped.push(outcome.name)
      continue
    }
    for (const record of outcome.file.records) {
      if (seenIds.has(record.id)) {
        console.warn(`content: ${outcome.name}: duplicate id ${record.id}; keeping the first`)
      }
      seenIds.add(record.id)
    }
    parsed.push(outcome.file)
  }

  return { db: buildContentDb(parsed, meta), error: null, skipped }
}

async function loadListedFile(
  fetchImpl: typeof fetch,
  name: string,
): Promise<{ ok: true; name: string; file: ContentFile } | { ok: false; name: string; reason: string }> {
  const fetched = await fetchJson(fetchImpl, `${CONTENT_BASE}${name}`)
  if (!fetched.ok) return { ok: false, name, reason: fetched.reason }

  let file: ContentFile
  try {
    file = parseContentFile(fetched.data, name)
  } catch (e) {
    return {
      ok: false,
      name,
      reason: e instanceof Error ? oneLine(e.message) : 'failed schema validation',
    }
  }

  const expected = name.replace(/\.json$/, '')
  if (file.type !== expected) {
    return { ok: false, name, reason: `type "${file.type}" does not match file name` }
  }
  return { ok: true, name, file }
}

async function fetchJson(
  fetchImpl: typeof fetch,
  path: string,
): Promise<{ ok: true; data: unknown } | { ok: false; reason: string }> {
  let res: Response
  try {
    res = await fetchImpl(path)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'network error'
    return { ok: false, reason: `failed to fetch (${message})` }
  }
  if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` }
  try {
    return { ok: true, data: await res.json() }
  } catch {
    return { ok: false, reason: 'invalid JSON' }
  }
}

function failMeta(reason: string): LoadContentResult {
  const error = oneLine(reason.startsWith('content:') ? reason : `content: ${reason}`)
  console.warn(error)
  return { db: emptyContentDb(null), error, skipped: [] }
}

function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}
