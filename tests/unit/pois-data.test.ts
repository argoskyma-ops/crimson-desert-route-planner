/**
 * Sanity checks on a locally generated data/pois.json (D14).
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { countPois, validatePois } from '../../src/content/pois-loader'
import { loadWaterMaskFile, WATER_MASK_PATH } from './water-mask-file'

const POIS_PATH = 'data/pois.json'
const MANIFEST_PATH = 'data/map/manifest.json'
/** Pywel window (D1); read from the manifest when the tiles are present. */
const DEFAULT_BOUNDS: [number, number, number, number] = [1024, 1544, 6248, 6832]

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

const hasPois = existsSync(POIS_PATH)
const file = hasPois ? validatePois(readJson(POIS_PATH)) : null
const bounds: [number, number, number, number] = existsSync(MANIFEST_PATH)
  ? ((readJson(MANIFEST_PATH) as { bounds?: [number, number, number, number] }).bounds ??
    DEFAULT_BOUNDS)
  : DEFAULT_BOUNDS
const mask = existsSync(WATER_MASK_PATH) ? loadWaterMaskFile() : null

function inBounds(x: number, y: number): boolean {
  return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3]
}

describe.skipIf(!hasPois)('data/pois.json', () => {
  it('validates a large dump on the canonical image', () => {
    expect(file).not.toBeNull()
    expect(file!.imageSize).toEqual([8192, 8192])
    expect(file!.nodes.length).toBeGreaterThan(20_000)
    expect(file!.groups.length).toBeGreaterThanOrEqual(5)
    expect(file!.groups.length).toBeLessThanOrEqual(70)
  })

  it('keeps at least 95% of nodes inside the Pywel bounds', () => {
    expect(file).not.toBeNull()
    const inside = file!.nodes.filter((node) => inBounds(node.x, node.y)).length
    expect(inside / file!.nodes.length).toBeGreaterThanOrEqual(0.95)
  })

  it('has a mine_iron count in the measured range', () => {
    expect(file).not.toBeNull()
    const iron = countPois(file!).byType.get('mine_iron') ?? 0
    expect(iron).toBeGreaterThanOrEqual(2500)
    expect(iron).toBeLessThanOrEqual(3200)
  })

  it('drops empty groups and types', () => {
    expect(file).not.toBeNull()
    const { byType } = countPois(file!)
    for (const group of file!.groups) {
      expect(group.types.length).toBeGreaterThan(0)
      for (const type of group.types) {
        expect(byType.get(type.id) ?? 0).toBeGreaterThan(0)
      }
    }
  })

  it('keeps more than 5,000 real names and no @ references', () => {
    expect(file).not.toBeNull()
    const named = file!.nodes.filter((node) => node.name !== undefined)
    expect(named.length).toBeGreaterThan(5000)
    expect(named.filter((node) => node.name!.startsWith('@'))).toEqual([])
  })

  it('names camp_380 as Pailune Camp', () => {
    expect(file).not.toBeNull()
    const camp = file!.nodes.find((node) => node.id === 'camp_380')
    expect(camp).toBeDefined()
    expect(camp!.type).toBe('camp')
    expect(camp!.name).toBe('Pailune Camp')
  })

  describe.skipIf(mask === null)('on land', () => {
    it('keeps at least 90% of locations and services off water', () => {
      if (!file || !mask) return
      const landTypes = new Set<string>()
      for (const group of file.groups) {
        if (group.id === 'locations' || group.id === 'services') {
          for (const type of group.types) landTypes.add(type.id)
        }
      }
      const subset = file.nodes.filter((node) => landTypes.has(node.type))
      expect(subset.length).toBeGreaterThan(0)
      const onLand = subset.filter((node) => !mask.isWater({ x: node.x, y: node.y })).length
      expect(onLand / subset.length).toBeGreaterThanOrEqual(0.9)
    })
  })
})
