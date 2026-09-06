/**
 * Sanity checks on the committed dataset data/fast-travel.json.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateFastTravel } from '../../src/lib/fast-travel-loader'
import { loadWaterMaskFile, WATER_MASK_PATH } from './water-mask-file'

const MANIFEST_PATH = 'data/map/manifest.json'
/** Pywel window (D1); read from the manifest when the tiles are present. */
const DEFAULT_BOUNDS: [number, number, number, number] = [1024, 1544, 6248, 6832]

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

const file = validateFastTravel(readJson('data/fast-travel.json'))
const bounds: [number, number, number, number] = existsSync(MANIFEST_PATH)
  ? ((readJson(MANIFEST_PATH) as { bounds?: [number, number, number, number] }).bounds ??
    DEFAULT_BOUNDS)
  : DEFAULT_BOUNDS
const mask = existsSync(WATER_MASK_PATH) ? loadWaterMaskFile() : null

function inBounds(x: number, y: number): boolean {
  return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3]
}

describe('data/fast-travel.json', () => {
  it('validates and has teleports plus named camps and villages', () => {
    expect(file.imageSize).toEqual([8192, 8192])
    expect(file.locations.length).toBeGreaterThan(800)
    const byType: Record<string, number> = {}
    for (const loc of file.locations) {
      byType[loc.type] = (byType[loc.type] ?? 0) + 1
    }
    expect(byType.nexus).toBeGreaterThan(100)
    expect(byType.cresset).toBeGreaterThan(20)
    expect(byType.gate).toBeGreaterThan(10)
    expect(byType.bonfire).toBeGreaterThan(400)
    expect(byType.camp).toBeGreaterThan(20)
    expect(byType.village).toBeGreaterThan(8)
    expect(byType.place).toBeGreaterThan(3)
  })

  it('keeps camps, villages and places inside the Pywel bounds', () => {
    const outside = file.locations
      .filter((loc) => loc.type === 'camp' || loc.type === 'village' || loc.type === 'place')
      .filter((loc) => !inBounds(loc.x, loc.y))
      .map((loc) => `${loc.id} ${loc.name} (${loc.x}, ${loc.y})`)
    expect(outside).toEqual([])
  })

  it('places Hernand Castle on the central landmass', () => {
    const hernand = file.locations.find((loc) => loc.name === 'Hernand Castle')
    expect(hernand).toBeDefined()
    expect(hernand!.x).toBeGreaterThanOrEqual(2400)
    expect(hernand!.x).toBeLessThanOrEqual(2700)
    expect(hernand!.y).toBeGreaterThanOrEqual(4900)
    expect(hernand!.y).toBeLessThanOrEqual(5150)
  })
})

describe.skipIf(mask === null)('data/fast-travel.json on land', () => {
  it('keeps at least 95% of camps, villages, hearths and places on land', () => {
    if (!mask) return
    const named = file.locations.filter(
      (loc) =>
        loc.type === 'camp'
        || loc.type === 'village'
        || loc.type === 'hearth'
        || loc.type === 'place',
    )
    expect(named.length).toBeGreaterThan(0)
    const onLand = named.filter((loc) => !mask.isWater({ x: loc.x, y: loc.y })).length
    expect(onLand / named.length).toBeGreaterThanOrEqual(0.95)
  })
})
