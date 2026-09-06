import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONTENT_BASE, loadContent } from './loader.ts'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

function metaFor(files: string[]) {
  return {
    version: 1 as const,
    game: { name: 'Crimson Desert', version: '2.01.00', versionDate: '2026-09-04' },
    files,
  }
}

const itemFile = {
  version: 1 as const,
  type: 'item' as const,
  records: [{ ...head, id: 'item:iron', type: 'item' as const, name: 'Iron', category: 'material' as const }],
}

const vendorFile = {
  version: 1 as const,
  type: 'vendor' as const,
  records: [
    {
      ...head,
      id: 'vendor:counter',
      type: 'vendor' as const,
      name: 'Counter',
      shopType: 'smithy',
      inventory: [{ item: 'item:iron' }],
    },
  ],
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

function fetchMap(map: Record<string, Response>): typeof fetch {
  return async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    return map[url] ?? new Response('missing', { status: 404 })
  }
}

describe('loadContent', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads meta and listed files into a db', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: jsonResponse(metaFor(['item.json', 'vendor.json'])),
        [`${CONTENT_BASE}item.json`]: jsonResponse(itemFile),
        [`${CONTENT_BASE}vendor.json`]: jsonResponse(vendorFile),
      }),
    )
    expect(result.error).toBeNull()
    expect(result.skipped).toEqual([])
    expect(result.db.byId.size).toBe(2)
    expect(result.db.byId.has('item:iron')).toBe(true)
    expect(result.db.byId.has('vendor:counter')).toBe(true)
    expect(result.db.meta?.files).toEqual(['item.json', 'vendor.json'])
    expect(warn).toHaveBeenCalledTimes(0)
  })

  it('skips a listed file that 404s and keeps the rest', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: jsonResponse(metaFor(['item.json', 'vendor.json'])),
        [`${CONTENT_BASE}item.json`]: jsonResponse(itemFile),
        [`${CONTENT_BASE}vendor.json`]: new Response('missing', { status: 404 }),
      }),
    )
    expect(result.error).toBeNull()
    expect(result.skipped).toEqual(['vendor.json'])
    expect(result.db.byId.size).toBe(1)
    expect(result.db.byId.has('item:iron')).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('skips a listed file with invalid JSON', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: jsonResponse(metaFor(['item.json', 'vendor.json'])),
        [`${CONTENT_BASE}item.json`]: jsonResponse(itemFile),
        [`${CONTENT_BASE}vendor.json`]: new Response('{', { status: 200 }),
      }),
    )
    expect(result.error).toBeNull()
    expect(result.skipped).toEqual(['vendor.json'])
    expect(result.db.byId.has('item:iron')).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('skips a listed file that fails the schema', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: jsonResponse(metaFor(['item.json', 'vendor.json'])),
        [`${CONTENT_BASE}item.json`]: jsonResponse(itemFile),
        [`${CONTENT_BASE}vendor.json`]: jsonResponse({ version: 1, type: 'vendor', records: 'nope' }),
      }),
    )
    expect(result.error).toBeNull()
    expect(result.skipped).toEqual(['vendor.json'])
    expect(result.db.byId.has('item:iron')).toBe(true)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('returns an empty db when meta.json 404s', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: new Response('missing', { status: 404 }),
      }),
    )
    expect(result.db.byId.size).toBe(0)
    expect(result.db.meta).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.skipped).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('returns an empty db when meta.json is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const result = await loadContent(
      fetchMap({
        [`${CONTENT_BASE}meta.json`]: jsonResponse({ version: 1 }),
      }),
    )
    expect(result.db.byId.size).toBe(0)
    expect(result.db.meta).toBeNull()
    expect(result.error).toBeTruthy()
    expect(result.skipped).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
  })
})
