import { describe, expect, it } from 'vitest'
import {
  buildPoiIndex,
  clusterPois,
  nearestPoiOfType,
  poiGroupOf,
  visiblePois,
  type PoiBounds,
} from './poi-index.ts'
import type { PoiFile } from './pois-loader.ts'

function fixture(): PoiFile {
  return {
    version: 1,
    imageSize: [8192, 8192],
    source: 'test',
    fetched: '2026-09-06',
    groups: [
      {
        id: 'treasures',
        label: 'Treasures',
        defaultOn: true,
        category: '',
        types: [{ id: 'collection_chest', label: 'Collectible' }],
      },
      {
        id: 'mining',
        label: 'Mining',
        defaultOn: false,
        category: '',
        types: [{ id: 'mine_iron', label: 'Iron Mine' }],
      },
    ],
    nodes: [
      { id: 'chest_a', type: 'collection_chest', x: 10, y: 10 },
      { id: 'chest_b', type: 'collection_chest', x: 255, y: 10 },
      { id: 'chest_c', type: 'collection_chest', x: 256, y: 10 },
      { id: 'chest_d', type: 'collection_chest', x: 128, y: 128 },
      { id: 'chest_e', type: 'collection_chest', x: 10, y: 256 },
      { id: 'chest_f', type: 'collection_chest', x: 400, y: 400 },
      { id: 'chest_g', type: 'collection_chest', x: 70, y: 10 },
      { id: 'iron_a', type: 'mine_iron', x: 20, y: 20 },
      { id: 'iron_b', type: 'mine_iron', x: 300, y: 20 },
      { id: 'iron_c', type: 'mine_iron', x: 400, y: 20 },
      { id: 'iron_d', type: 'mine_iron', x: 700, y: 10 },
      { id: 'chest_h', type: 'collection_chest', x: 255, y: 255 },
    ],
  }
}

const ALL_ON = { treasures: true, mining: true }
const TREASURES_ONLY = { treasures: true }
const CELL_0: PoiBounds = { x0: 0, y0: 0, x1: 255, y1: 255 }
const WORLD: PoiBounds = { x0: 0, y0: 0, x1: 800, y1: 800 }

describe('poi-index', () => {
  const index = buildPoiIndex(fixture())

  it('buckets nodes by 256 px cells and maps types to groups', () => {
    expect(index.cellSize).toBe(256)
    expect(index.cells.get('0:0')?.map((node) => node.id)).toEqual([
      'chest_a',
      'chest_b',
      'chest_d',
      'chest_g',
      'iron_a',
      'chest_h',
    ])
    expect(index.cells.get('1:0')?.map((node) => node.id)).toEqual([
      'chest_c',
      'iron_b',
      'iron_c',
    ])
    const iron = index.byId.get('iron_a')
    expect(iron && poiGroupOf(index, iron)).toBe('mining')
  })

  it('returns in-bounds enabled nodes (edge-inclusive) and skips a disabled group', () => {
    expect(visiblePois(index, TREASURES_ONLY, CELL_0).map((node) => node.id)).toEqual([
      'chest_a',
      'chest_b',
      'chest_d',
      'chest_g',
      'chest_h',
    ])
    expect(visiblePois(index, ALL_ON, CELL_0).map((node) => node.id)).toEqual([
      'chest_a',
      'chest_b',
      'chest_d',
      'chest_g',
      'iron_a',
      'chest_h',
    ])
    expect(visiblePois(index, { mining: true }, CELL_0).map((node) => node.id)).toEqual([
      'iron_a',
    ])
    expect(visiblePois(index, {}, CELL_0)).toEqual([])
  })

  it('clusters enabled nodes, picks the dominant group, and skips empty cells', () => {
    const byCell = new Map(
      clusterPois(index, ALL_ON, WORLD, 256).map((cell) => [`${cell.cellX}:${cell.cellY}`, cell]),
    )
    expect(byCell.size).toBe(5)
    expect(byCell.get('0:0')).toEqual({
      cellX: 0,
      cellY: 0,
      x: 128,
      y: 128,
      count: 6,
      groupId: 'treasures',
    })
    expect(byCell.get('1:0')).toEqual({
      cellX: 1,
      cellY: 0,
      x: 384,
      y: 128,
      count: 3,
      groupId: 'mining',
    })
    expect(byCell.get('0:1')).toEqual({
      cellX: 0,
      cellY: 1,
      x: 128,
      y: 384,
      count: 1,
      groupId: 'treasures',
    })
    expect(byCell.get('1:1')?.groupId).toBe('treasures')
    expect(byCell.get('2:0')?.groupId).toBe('mining')
    expect(byCell.has('2:1')).toBe(false)
  })

  it('clusters at a cell size smaller than the index cell', () => {
    const clusters = clusterPois(index, TREASURES_ONLY, { x0: 0, y0: 0, x1: 80, y1: 20 }, 64)
    const byCell = new Map(clusters.map((cell) => [`${cell.cellX}:${cell.cellY}`, cell]))
    expect(byCell.get('0:0')).toMatchObject({ count: 1, groupId: 'treasures', x: 32, y: 32 })
    expect(byCell.get('1:0')).toMatchObject({ count: 1, groupId: 'treasures', x: 96, y: 32 })
    expect(byCell.size).toBe(2)
  })

  it('finds the nearest node of a type and returns null for an unknown type', () => {
    expect(nearestPoiOfType(index, 'collection_chest', { x: 0, y: 0 })?.id).toBe('chest_a')
    expect(nearestPoiOfType(index, 'collection_chest', { x: 250, y: 0 })?.id).toBe('chest_b')
    expect(nearestPoiOfType(index, 'nope', { x: 0, y: 0 })).toBeNull()
  })
})
