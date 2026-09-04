/**
 * Sanity checks on the committed dataset data/fast-travel.json.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateFastTravel } from '../../src/lib/fast-travel-loader'

const file = validateFastTravel(JSON.parse(readFileSync('data/fast-travel.json', 'utf8')))

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
})
