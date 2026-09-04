/**
 * Checks the committed water mask against the committed road graph: known
 * land/water landmarks, the half-resolution scale (zoom 3 of the pyramid), and the effect of D10 on
 * dead-end connectors. Skips when either dataset is missing.
 */
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateRoads } from '../../src/lib/roads-loader'
import { buildGraph } from '../../src/routing'
import type { Pt, RoadsFile } from '../../src/routing/types'
import { loadWaterMaskFile, WATER_MASK_PATH } from './water-mask-file'

const ROADS_PATH = 'data/roads.json'
const mask = existsSync(WATER_MASK_PATH) ? loadWaterMaskFile() : null
const roads: RoadsFile | null = existsSync(ROADS_PATH)
  ? validateRoads(JSON.parse(readFileSync(ROADS_PATH, 'utf8')))
  : null

/** Canonical-pixel landmarks (D3), verified against the committed mask. */
const SENA_RIVER: Pt = { x: 3_536, y: 4_246 }
const SENA_BANK: Pt = { x: 3_318, y: 4_319 }
const OPEN_LAND: Pt = { x: 2_245, y: 4_569 }
const NORTH_BANK: Pt = { x: 3_487, y: 4_259 }
const SOUTH_BANK: Pt = { x: 3_603, y: 4_259 }

describe.skipIf(mask === null)('data/water-mask.png', () => {
  it('reads the known land and water landmarks', () => {
    if (!mask) return
    expect(mask.isWater(SENA_RIVER)).toBe(true)
    expect(mask.isWater(SENA_BANK)).toBe(false)
    expect(mask.isWater(OPEN_LAND)).toBe(false)
    expect(mask.isWater(NORTH_BANK)).toBe(false)
    expect(mask.isWater(SOUTH_BANK)).toBe(false)
  })

  it('reports crossings of the Sena river and none over open land', () => {
    if (!mask) return
    expect(mask.crosses(SENA_BANK, SENA_RIVER)).toBe(true)
    // Both banks are dry; the water is only in between.
    expect(mask.crosses(NORTH_BANK, SOUTH_BANK)).toBe(true)
    expect(mask.crosses(OPEN_LAND, { x: OPEN_LAND.x + 120, y: OPEN_LAND.y })).toBe(false)
  })

  it('covers the map at half resolution', () => {
    if (!mask || !roads) return
    expect(mask.scale).toBe(0.5)
    expect(mask.width).toBe(Math.ceil(roads.imageSize[0] * mask.scale))
    expect(mask.height).toBe(Math.ceil(roads.imageSize[1] * mask.scale))
    // Every corner of the map is inside the mask.
    expect(mask.isWater({ x: roads.imageSize[0] - 1, y: roads.imageSize[1] - 1 })).toBe(false)
  })
})

describe.skipIf(mask === null || roads === null)('data/roads.json with the water mask', () => {
  it('drops the dead-end connectors that jump water', () => {
    if (!mask || !roads) return
    const dry = buildGraph(roads)
    const wet = buildGraph(roads, { water: mask })

    console.log(
      `D10 connectors on data/roads.json: ${dry.connectorCount} without the mask, `
      + `${wet.connectorCount} with it (${dry.connectorCount - wet.connectorCount} dropped).`,
    )
    expect(dry.connectorCount).toBeGreaterThan(0)
    expect(wet.connectorCount).toBeGreaterThan(0)
    expect(wet.connectorCount).toBeLessThan(dry.connectorCount)
    expect(wet.water).toBe(mask)
  })
})
