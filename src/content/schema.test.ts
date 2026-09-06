import { describe, expect, it } from 'vitest'
import { extractLinks, makeId, parseId, slugify } from './ids.ts'
import {
  collectRefs,
  compareGameVersions,
  parseContentFile,
  parseEntity,
  parseMeta,
} from './schema.ts'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

describe('ids', () => {
  it('parses well-formed ids of known types', () => {
    expect(parseId('quest:dead-of-night')).toEqual({ type: 'quest', slug: 'dead-of-night' })
    expect(parseId('Quest:x')).toBeNull()
    expect(parseId('spaceship:x')).toBeNull()
    expect(parseId('quest:Dead')).toBeNull()
    expect(parseId('quest:-bad')).toBeNull()
  })

  it('slugifies display names', () => {
    expect(slugify("Rhett's Armoury")).toBe('rhetts-armoury')
    expect(slugify('Trial of the Winds!')).toBe('trial-of-the-winds')
    expect(slugify('Café  Élan')).toBe('cafe-elan')
    expect(makeId('mount', slugify('Rokade'))).toBe('mount:rokade')
    expect(() => makeId('mount', 'Not Ok')).toThrow()
  })

  it('extracts [[id]] links', () => {
    expect(extractLinks('See [[faction:greymanes]] and [[quest:dead-of-night]].')).toEqual([
      'faction:greymanes',
      'quest:dead-of-night',
    ])
    expect(extractLinks('no links')).toEqual([])
  })
})

describe('entity schemas', () => {
  it('applies defaults and accepts every type with minimal bodies', () => {
    const quest = parseEntity({
      ...head,
      id: 'quest:x',
      type: 'quest',
      name: 'X',
      kind: 'side',
      location: { x: 10, y: 20 },
    })
    if (quest.type !== 'quest') throw new Error('unreachable')
    expect(quest.steps).toEqual([])
    expect(quest.missable).toBe('no')
    expect(quest.repeatable).toBe(false)
    expect(quest.location?.map).toBe('pywel')

    const item = parseEntity({ ...head, id: 'item:x', type: 'item', name: 'X', category: 'weapon' })
    if (item.type !== 'item') throw new Error('unreachable')
    expect(item.acquisitions).toEqual([])

    const character = parseEntity({
      ...head,
      id: 'character:x',
      type: 'character',
      name: 'X',
      role: 'r',
    })
    if (character.type !== 'character') throw new Error('unreachable')
    expect(character.playable).toBe(false)

    parseEntity({ ...head, id: 'region:x', type: 'region', name: 'X', kind: 'region' })
    parseEntity({ ...head, id: 'place:x', type: 'place', name: 'X', kind: 'camp' })
    parseEntity({ ...head, id: 'faction:x', type: 'faction', name: 'X', kind: 'house' })
    parseEntity({
      ...head,
      id: 'storyline:x',
      type: 'storyline',
      name: 'X',
      kind: 'main',
      chapters: [{ title: 'c', quests: ['quest:x'] }],
    })
    parseEntity({
      ...head,
      id: 'collectible:x',
      type: 'collectible',
      name: 'X',
      collection: 'collection:x',
    })
    parseEntity({ ...head, id: 'collection:x', type: 'collection', name: 'X' })
    parseEntity({ ...head, id: 'vendor:x', type: 'vendor', name: 'X', shopType: 'smithy' })
    parseEntity({
      ...head,
      id: 'recipe:x',
      type: 'recipe',
      name: 'X',
      station: 'cooking',
      inputs: [{ item: 'item:a', qty: 1 }],
      output: { item: 'item:b', qty: 1 },
    })
    parseEntity({
      ...head,
      id: 'skill:x',
      type: 'skill',
      name: 'X',
      character: 'kliff',
      tree: 'stamina',
    })
    parseEntity({ ...head, id: 'enemy:x', type: 'enemy', name: 'X', rank: 'elite' })
    parseEntity({ ...head, id: 'mount:x', type: 'mount', name: 'X', species: 'horse' })
    parseEntity({ ...head, id: 'activity:x', type: 'activity', name: 'X', kind: 'minigame' })
    parseEntity({
      ...head,
      id: 'guide:x',
      type: 'guide',
      name: 'X',
      target: 'item:x',
      steps: [{ text: 'go' }],
    })
  })

  it('rejects bad ids, missing sources, long summaries and wrong ref types', () => {
    expect(() =>
      parseEntity({ ...head, id: 'Quest:x', type: 'quest', name: 'X', kind: 'side' }),
    ).toThrow()
    expect(() =>
      parseEntity({
        ...head,
        id: 'quest:x',
        type: 'quest',
        name: 'X',
        kind: 'side',
        related: ['spaceship:foo'],
      }),
    ).toThrow(/known entity type/)
    expect(() =>
      parseEntity({
        ...head,
        id: 'quest:x',
        type: 'quest',
        name: 'X',
        kind: 'side',
        steps: [{ text: 'grab it', missable: 'lost-if' }],
      }),
    ).toThrow(/missableNote/)
    expect(() =>
      parseEntity({ ...head, id: 'quest:x', type: 'quest', name: 'X', kind: 'side', chapter: 2 }),
    ).toThrow()
    expect(() =>
      parseEntity({
        ...head,
        sources: [{ url: 'https://example.com', accessed: '2999-01-01' }],
        id: 'quest:x',
        type: 'quest',
        name: 'X',
        kind: 'side',
      }),
    ).toThrow(/future/)
    expect(() =>
      parseEntity({ ...head, sources: [], id: 'quest:x', type: 'quest', name: 'X', kind: 'side' }),
    ).toThrow(/sources/)
    expect(() =>
      parseEntity({
        ...head,
        summary: 'x'.repeat(241),
        id: 'quest:x',
        type: 'quest',
        name: 'X',
        kind: 'side',
      }),
    ).toThrow(/summary/)
    expect(() =>
      parseEntity({
        ...head,
        id: 'quest:x',
        type: 'quest',
        name: 'X',
        kind: 'side',
        giver: 'faction:not-a-character',
      }),
    ).toThrow(/character/)
    expect(() =>
      parseEntity({ ...head, id: 'item:x', type: 'item', name: 'X', category: 'spaceship' }),
    ).toThrow()
    expect(() =>
      parseEntity({
        ...head,
        gameVersion: 'v2',
        id: 'item:x',
        type: 'item',
        name: 'X',
        category: 'tool',
      }),
    ).toThrow(/gameVersion/)
  })

  it('collects refs and links', () => {
    const entity = parseEntity({
      ...head,
      id: 'item:x',
      type: 'item',
      name: 'X',
      category: 'armor',
      body: 'Dropped by [[enemy:crow]]; see [[quest:y]] but not [[quest:--bad]].',
      related: ['place:p'],
      acquisitions: [
        { kind: 'drop', ref: 'enemy:crow', steps: [{ text: 't', refs: ['place:q'] }] },
      ],
    })
    const { refs, links } = collectRefs(entity)
    expect(refs.sort()).toEqual(['enemy:crow', 'place:p', 'place:q'])
    expect(links).toEqual(['enemy:crow', 'quest:y'])
  })
})

describe('content files', () => {
  it('checks record types and duplicate ids', () => {
    const good = parseContentFile({
      version: 1,
      type: 'mount',
      records: [{ ...head, id: 'mount:x', type: 'mount', name: 'X', species: 'horse' }],
    })
    expect(good.records).toHaveLength(1)
    expect(() =>
      parseContentFile({
        version: 1,
        type: 'mount',
        records: [{ ...head, id: 'item:x', type: 'item', name: 'X', category: 'tool' }],
      }),
    ).toThrow(/mount file/)
    expect(() =>
      parseContentFile({
        version: 1,
        type: 'mount',
        records: [
          { ...head, id: 'mount:x', type: 'mount', name: 'X', species: 'horse' },
          { ...head, id: 'mount:x', type: 'mount', name: 'Y', species: 'horse' },
        ],
      }),
    ).toThrow(/duplicate/)
  })

  it('compares game versions numerically', () => {
    expect(compareGameVersions('2.9.00', '2.10.00')).toBeLessThan(0)
    expect(compareGameVersions('2.01.00', '2.1')).toBe(0)
    expect(compareGameVersions('3.0.0', '2.99.99')).toBeGreaterThan(0)
  })

  it('parses meta.json', () => {
    const meta = parseMeta({
      version: 1,
      game: { name: 'Crimson Desert', version: '2.01.00', versionDate: '2026-09-04' },
      files: ['quest.json'],
    })
    expect(meta.expansions).toEqual([])
    expect(() => parseMeta({ version: 1, game: {}, files: [] })).toThrow()
  })
})
