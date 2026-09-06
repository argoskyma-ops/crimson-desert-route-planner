/**
 * Validates the committed content in data/content/ (docs/DECISIONS.md D12):
 * every file listed in meta.json parses, ids are unique across files, every
 * ref and [[link]] resolves, locations sit inside the Pywel bounds and on
 * land, and the game version matches meta.json.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectRefs, compareGameVersions, parseContentFile, parseMeta } from '../../src/content/schema.ts'
import type { ContentFile, Entity } from '../../src/content/types.ts'
import { loadWaterMaskFile, WATER_MASK_PATH } from './water-mask-file'

const CONTENT_DIR = 'data/content'
const MANIFEST_PATH = 'data/map/manifest.json'
/** Pywel window (D1); read from the manifest when the tiles are present. */
const DEFAULT_BOUNDS: [number, number, number, number] = [1024, 1544, 6248, 6832]

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

const meta = parseMeta(readJson(join(CONTENT_DIR, 'meta.json')))
const files: ContentFile[] = meta.files.map((name) =>
  parseContentFile(readJson(join(CONTENT_DIR, name)), name),
)
const records: Entity[] = files.flatMap((file) => file.records)
const ids = new Set(records.map((record) => record.id))
const bounds: [number, number, number, number] = existsSync(MANIFEST_PATH)
  ? ((readJson(MANIFEST_PATH) as { bounds?: [number, number, number, number] }).bounds ??
    DEFAULT_BOUNDS)
  : DEFAULT_BOUNDS
const mask = existsSync(WATER_MASK_PATH) ? loadWaterMaskFile() : null
const FAST_TRAVEL_PATH = 'data/fast-travel.json'
const fastTravelIds = new Set(
  existsSync(FAST_TRAVEL_PATH)
    ? (readJson(FAST_TRAVEL_PATH) as { locations: { id: string }[] }).locations.map((l) => l.id)
    : [],
)

interface Located {
  x: number
  y: number
  map: string
  where: string
}

function locationsOf(entity: Entity): Located[] {
  const out: Located[] = []
  const walk = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`))
      return
    }
    if (typeof value !== 'object' || value === null) return
    const obj = value as Record<string, unknown>
    if (typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.map === 'string') {
      out.push({ x: obj.x, y: obj.y, map: obj.map, where: path })
      return
    }
    for (const [key, item] of Object.entries(obj)) walk(item, `${path}.${key}`)
  }
  walk(entity, entity.id)
  return out
}

describe('data/content', () => {
  it('lists every content file and each file matches its type', () => {
    expect(meta.files.length).toBeGreaterThan(0)
    for (const [index, file] of files.entries()) {
      expect(file.type, meta.files[index]).toBe(meta.files[index].replace(/\.json$/, ''))
    }
  })

  it('has unique ids across files', () => {
    expect(ids.size).toBe(records.length)
  })

  it('resolves every ref and [[link]] and never points at itself', () => {
    const missing: string[] = []
    const self: string[] = []
    for (const record of records) {
      const { refs, links } = collectRefs(record)
      for (const ref of [...refs, ...links]) {
        if (!ids.has(ref)) missing.push(`${record.id} -> ${ref}`)
        if (ref === record.id) self.push(record.id)
      }
    }
    expect(missing).toEqual([])
    expect(self).toEqual([])
  })

  it('points place.fastTravel at an id in data/fast-travel.json', () => {
    if (fastTravelIds.size === 0) return
    const bad: string[] = []
    for (const record of records) {
      if (record.type === 'place' && record.fastTravel && !fastTravelIds.has(record.fastTravel)) {
        bad.push(`${record.id} -> ${record.fastTravel}`)
      }
    }
    expect(bad).toEqual([])
  })

  it('keeps Pywel locations inside the bounds and on land', () => {
    const outside: string[] = []
    const wet: string[] = []
    for (const record of records) {
      for (const loc of locationsOf(record)) {
        if (loc.map !== 'pywel') continue
        const inside =
          loc.x >= bounds[0] && loc.x <= bounds[2] && loc.y >= bounds[1] && loc.y <= bounds[3]
        if (!inside) outside.push(`${loc.where} (${loc.x}, ${loc.y})`)
        else if (mask && mask.isWater({ x: loc.x, y: loc.y }))
          wet.push(`${loc.where} (${loc.x}, ${loc.y})`)
      }
    }
    expect(outside).toEqual([])
    expect(wet).toEqual([])
  })

  it('is checked against the game version in meta.json or older', () => {
    const current = meta.game.version
    for (const record of records) {
      expect(
        compareGameVersions(record.gameVersion, current) <= 0,
        `${record.id} is newer than meta.json`,
      ).toBe(true)
    }
  })

  it('has at least one https source per record', () => {
    for (const record of records) {
      expect(record.sources.length, record.id).toBeGreaterThan(0)
      for (const source of record.sources) expect(source.url, record.id).toMatch(/^https:\/\//)
    }
  })
})
