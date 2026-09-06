import { describe, expect, it } from 'vitest'
import { buildContentDb } from './db.ts'
import { parseContentFile } from './schema.ts'
import { buildSearchIndex, search, topHit, type SearchGroup, type SearchHit } from './search.ts'
import type { ContentFile } from './types.ts'
import type { FastTravelLocation } from '../lib/fast-travel-loader'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

const FAST_TRAVEL: readonly FastTravelLocation[] = [
  { id: 'nexus:-1:1', type: 'nexus', name: 'Abyss Nexus', x: 1200, y: 1800 },
  { id: 'place:pailune', type: 'place', name: 'Pailune', x: 2775.2, y: 3514.7 },
]

const POI_TYPES = [{ id: 'mine_iron', label: 'Iron Mine', group: 'mining' }] as const

function fixtureFiles(): ContentFile[] {
  return [
    parseContentFile({
      version: 1,
      type: 'item',
      records: [
        { ...head, id: 'item:canta-plate', type: 'item', name: 'Canta Plate', category: 'armor' },
        { ...head, id: 'item:rokadd', type: 'item', name: 'Rokadd', category: 'material' },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'mount',
      records: [
        {
          ...head,
          id: 'mount:rokade',
          type: 'mount',
          name: 'Rokade',
          species: 'horse',
          aliases: ['black horse'],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'quest',
      records: [
        {
          ...head,
          id: 'quest:trial-of-the-winds',
          type: 'quest',
          name: 'Trial of the Winds',
          kind: 'side',
        },
        {
          ...head,
          id: 'quest:hernand',
          type: 'quest',
          name: 'Hernand',
          kind: 'side',
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'character',
      records: [
        {
          ...head,
          id: 'character:hernand-scout',
          type: 'character',
          name: 'Hernand the Scout',
          role: 'member',
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'place',
      records: [
        {
          ...head,
          id: 'place:hernand-castle',
          type: 'place',
          name: 'Hernand Castle',
          kind: 'castle',
        },
        { ...head, id: 'place:pailune', type: 'place', name: 'Pailune', kind: 'town' },
      ],
    }),
  ]
}

function indexOfFixture() {
  return buildSearchIndex(buildContentDb(fixtureFiles()), FAST_TRAVEL, POI_TYPES)
}

function flatten(groups: SearchGroup[]): SearchHit[] {
  return groups.flatMap((group) => group.hits)
}

function findHit(
  groups: SearchGroup[],
  ref: string,
  kind?: SearchHit['kind'],
): SearchHit | undefined {
  return flatten(groups).find((hit) => hit.ref === ref && (kind === undefined || hit.kind === kind))
}

describe('search', () => {
  const index = indexOfFixture()

  it('ranks exact above prefix above fuzzy', () => {
    expect(topHit(search(index, 'rokade'))).toMatchObject({
      ref: 'mount:rokade',
      kind: 'entity',
      type: 'mount',
      tier: 'exact',
    })
    expect(findHit(search(index, 'rok'), 'mount:rokade')?.tier).toBe('prefix')

    const typo = search(index, 'rokadd')
    expect(findHit(typo, 'mount:rokade')?.tier).toBe('fuzzy')
    expect(topHit(typo)).toMatchObject({ ref: 'item:rokadd', kind: 'entity', tier: 'exact' })
  })

  it('finds a mount through an alias', () => {
    const hit = topHit(search(index, 'black horse'))
    expect(hit).toMatchObject({ ref: 'mount:rokade', kind: 'entity', tier: 'exact' })
  })

  it('returns a POI type hit grouped by its group id', () => {
    const groups = search(index, 'iron')
    const hit = findHit(groups, 'mine_iron', 'poi-type')
    expect(hit).toMatchObject({ kind: 'poi-type', type: 'mining', name: 'Iron Mine' })
    expect(groups.find((group) => group.type === 'mining')?.label).toBe('Mining')
  })

  it('lists fast-travel points for "nexus"', () => {
    const groups = search(index, 'nexus')
    const hit = flatten(groups).find((item) => item.kind === 'place' && item.type === 'nexus')
    expect(hit).toMatchObject({
      kind: 'place',
      type: 'nexus',
      ref: 'nexus:-1:1',
      name: 'Abyss Nexus',
    })
    expect(groups.find((group) => group.type === 'nexus')?.label).toBe('Abyss Nexus')
  })

  it('keeps a fast-travel place and a content place with the same id as separate hits', () => {
    const groups = search(index, 'pailune')
    const hits = flatten(groups).filter((hit) => hit.ref === 'place:pailune')
    expect(hits).toHaveLength(2)
    expect(hits.some((hit) => hit.kind === 'entity')).toBe(true)
    expect(hits.some((hit) => hit.kind === 'place')).toBe(true)
    expect(groups[0]?.label).toBe('Places')
  })

  it('orders groups by the best hit', () => {
    const groups = search(index, 'rokadd')
    expect(groups[0]?.type).toBe('item')
    expect(groups.findIndex((group) => group.type === 'mount')).toBeGreaterThan(0)
  })

  it('returns no groups for an empty or whitespace query', () => {
    expect(search(index, '')).toEqual([])
    expect(search(index, '   ')).toEqual([])
  })

  it('returns null from topHit on an empty list', () => {
    expect(topHit([])).toBeNull()
  })

  it('returns [] or hits for a punctuation-only query without throwing', () => {
    expect(() => search(index, '...')).not.toThrow()
    const groups = search(index, '...')
    expect(Array.isArray(groups)).toBe(true)
  })

  it('returns hits for a one-letter query without throwing', () => {
    expect(() => search(index, 'r')).not.toThrow()
    expect(flatten(search(index, 'r')).length).toBeGreaterThan(0)
  })

  it('applies options.filter before ranking and limit', () => {
    expect(topHit(search(index, 'hernand'))?.type).not.toBe('character')
    const filtered = search(index, 'hernand', 8, { filter: (hit) => hit.type === 'character' })
    const hits = flatten(filtered)
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.every((hit) => hit.type === 'character')).toBe(true)
  })

  it('treats an alias word-prefix as prefix', () => {
    expect(findHit(search(index, 'horse'), 'mount:rokade')?.tier).toBe('prefix')
  })
})
