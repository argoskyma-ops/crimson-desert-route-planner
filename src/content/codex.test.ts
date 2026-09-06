import { describe, expect, it } from 'vitest'
import {
  codexFacets,
  codexTypeCounts,
  facetsFor,
  filterCodex,
} from './codex.ts'
import { buildContentDb } from './db.ts'
import { parseContentFile } from './schema.ts'
import { ENTITY_TYPE_ORDER, type ContentFile } from './types.ts'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

function fixtureFiles(): ContentFile[] {
  return [
    parseContentFile({
      version: 1,
      type: 'region',
      records: [
        { ...head, id: 'region:hernand', type: 'region', name: 'Hernand', kind: 'region' },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'faction',
      records: [
        {
          ...head,
          id: 'faction:greymanes',
          type: 'faction',
          name: 'Greymanes',
          kind: 'mercenary',
        },
        {
          ...head,
          id: 'faction:black-bears',
          type: 'faction',
          name: 'Black Bears',
          kind: 'hostile',
          hostile: true,
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'item',
      records: [
        {
          ...head,
          id: 'item:axe',
          type: 'item',
          name: 'Axe',
          category: 'weapon',
          rarity: 'unique',
        },
        {
          ...head,
          id: 'item:helm',
          type: 'item',
          name: 'Helm',
          category: 'armor',
          setName: 'Blackwing',
          region: 'region:hernand',
        },
        {
          ...head,
          id: 'item:plate',
          type: 'item',
          name: 'Plate',
          category: 'armor',
          setName: 'Canta Plate',
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'character',
      records: [
        {
          ...head,
          id: 'character:split',
          type: 'character',
          name: 'Split',
          role: 'Mercenary',
          factions: ['faction:greymanes', 'faction:black-bears'],
        },
        {
          ...head,
          id: 'character:loner',
          type: 'character',
          name: 'Loner',
          role: 'Wanderer',
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'quest',
      records: [
        { ...head, id: 'quest:alpha', type: 'quest', name: 'Alpha', kind: 'main' },
      ],
    }),
  ]
}

const db = buildContentDb(fixtureFiles())

describe('facetsFor', () => {
  it('puts region first, then the type-specific ids, and region-only types stay at region', () => {
    expect(facetsFor('item').map((spec) => spec.id)).toEqual([
      'region',
      'category',
      'rarity',
      'set',
    ])
    expect(facetsFor('collection').map((spec) => spec.id)).toEqual(['region'])
    expect(facetsFor('guide').map((spec) => spec.id)).toEqual(['region'])
  })
})

describe('codexTypeCounts', () => {
  it('matches the db in ENTITY_TYPE_ORDER', () => {
    const counts = codexTypeCounts(db)
    expect(counts.map((row) => row.type)).toEqual([...ENTITY_TYPE_ORDER])
    expect(Object.fromEntries(counts.map((row) => [row.type, row.count]))).toEqual({
      quest: 1,
      item: 3,
      place: 0,
      collectible: 0,
      mount: 0,
      character: 2,
      vendor: 0,
      enemy: 0,
      recipe: 0,
      skill: 0,
      guide: 0,
      storyline: 0,
      faction: 2,
      collection: 0,
      activity: 0,
      region: 1,
    })
    expect(counts.reduce((sum, row) => sum + row.count, 0)).toBe(db.byId.size)
  })
})

describe('filterCodex', () => {
  it('returns every record of the type sorted by name when the selection is empty', () => {
    expect(filterCodex(db, 'item', {}).map((record) => record.name)).toEqual([
      'Axe',
      'Helm',
      'Plate',
    ])
  })

  it('filters items by category', () => {
    expect(filterCodex(db, 'item', { category: 'weapon' }).map((record) => record.id)).toEqual([
      'item:axe',
    ])
    expect(filterCodex(db, 'item', { category: 'armor' }).map((record) => record.id)).toEqual([
      'item:helm',
      'item:plate',
    ])
  })

  it('finds a character with two factions under either faction', () => {
    expect(
      filterCodex(db, 'character', { faction: 'faction:greymanes' }).map((record) => record.id),
    ).toEqual(['character:split'])
    expect(
      filterCodex(db, 'character', { faction: 'faction:black-bears' }).map((record) => record.id),
    ).toEqual(['character:split'])
  })

  it('matches none for records without the field', () => {
    expect(
      filterCodex(db, 'character', { faction: 'none' }).map((record) => record.id),
    ).toEqual(['character:loner'])
    expect(filterCodex(db, 'item', { rarity: 'none' }).map((record) => record.id)).toEqual([
      'item:helm',
      'item:plate',
    ])
    expect(filterCodex(db, 'item', { region: 'none' }).map((record) => record.id)).toEqual([
      'item:axe',
      'item:plate',
    ])
  })

  it('ignores unknown facet ids in the selection', () => {
    expect(
      filterCodex(db, 'item', { category: 'armor', nope: 'x' }).map((record) => record.id),
    ).toEqual(filterCodex(db, 'item', { category: 'armor' }).map((record) => record.id))
  })
})

describe('codexFacets', () => {
  it('counts against the other facets and ignores the facet own selection', () => {
    const facets = codexFacets(db, 'item', { category: 'armor' })
    const category = facets.find((facet) => facet.id === 'category')
    expect(category?.values.map((entry) => [entry.value, entry.count])).toEqual([
      ['armor', 2],
      ['weapon', 1],
    ])
    const rarity = facets.find((facet) => facet.id === 'rarity')
    expect(rarity?.values.map((entry) => [entry.value, entry.count])).toEqual([
      ['unique', 0],
      ['none', 2],
    ])
  })

  it('sorts values by label with none last', () => {
    const itemFacets = codexFacets(db, 'item', {})
    expect(itemFacets.find((facet) => facet.id === 'rarity')?.values.map((entry) => entry.value)).toEqual(
      ['unique', 'none'],
    )
    expect(itemFacets.find((facet) => facet.id === 'set')?.values.map((entry) => entry.value)).toEqual([
      'Blackwing',
      'Canta Plate',
      'none',
    ])
    const factions = codexFacets(db, 'character', {}).find((facet) => facet.id === 'faction')
    expect(factions?.values.map((entry) => entry.label)).toEqual([
      'Black Bears',
      'Greymanes',
      'none',
    ])
  })
})
