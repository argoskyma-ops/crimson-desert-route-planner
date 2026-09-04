import { describe, expect, it } from 'vitest'
import { FAST_TRAVEL_TYPES_DEFAULT } from '../config/travel'
import {
  filterFastTravel,
  searchFastTravel,
  validateFastTravel,
  type FastTravelFile,
} from './fast-travel-loader'

function sample(): FastTravelFile {
  return {
    version: 1,
    imageSize: [100, 80],
    source: 'test',
    locations: [{ id: 'nexus:0:0', type: 'nexus', name: 'Abyss Nexus', x: 10, y: 20 }],
  }
}

describe('validateFastTravel', () => {
  it('accepts a valid file', () => {
    expect(validateFastTravel(sample()).locations).toHaveLength(1)
  })

  it('rejects a duplicate id', () => {
    const file = sample()
    expect(() =>
      validateFastTravel({
        ...file,
        locations: [file.locations[0], { ...file.locations[0], x: 11 }],
      }),
    ).toThrow('duplicate id')
  })

  it('rejects a point outside imageSize', () => {
    const file = sample()
    expect(() =>
      validateFastTravel({
        ...file,
        locations: [{ ...file.locations[0], x: 101 }],
      }),
    ).toThrow('outside imageSize')
  })

  it('rejects an unknown type', () => {
    const file = sample()
    expect(() =>
      validateFastTravel({
        ...file,
        locations: [{ ...file.locations[0], type: 'temple' }],
      }),
    ).toThrow('type must be nexus, cresset, gate, bonfire, camp, village, place, hearth')
  })
})

describe('filterFastTravel / searchFastTravel', () => {
  const locations = [
    { id: 'n1', type: 'nexus' as const, name: 'Abyss Nexus', x: 1, y: 1 },
    { id: 'c1', type: 'cresset' as const, name: 'Sting', x: 2, y: 2 },
    { id: 'b1', type: 'bonfire' as const, name: 'Bonfire', x: 3, y: 3 },
    { id: 'v1', type: 'village' as const, name: 'Muiquun', x: 4, y: 4 },
    { id: 'p1', type: 'camp' as const, name: 'Pailune Camp', x: 5, y: 5 },
    { id: 'p2', type: 'place' as const, name: 'Pailune', x: 6, y: 6 },
  ]

  it('hides disabled types', () => {
    const visible = filterFastTravel(locations, FAST_TRAVEL_TYPES_DEFAULT, '')
    expect(visible.map((loc) => loc.id)).toEqual(['n1', 'c1', 'v1', 'p1', 'p2'])
  })

  it('filters by name and keeps type chips', () => {
    const visible = filterFastTravel(locations, FAST_TRAVEL_TYPES_DEFAULT, 'sting')
    expect(visible.map((loc) => loc.id)).toEqual(['c1'])
  })

  it('searches across types that are currently hidden', () => {
    expect(searchFastTravel(locations, 'bon').map((loc) => loc.id)).toEqual(['b1'])
  })

  it('ranks an exact place name ahead of camps that contain it', () => {
    expect(searchFastTravel(locations, 'pailune').map((loc) => loc.id)).toEqual(['p2', 'p1'])
  })
})
