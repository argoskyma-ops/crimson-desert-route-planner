import { describe, expect, it } from 'vitest'
import { buildContentDb, related } from './db.ts'
import { parseContentFile } from './schema.ts'
import type { ContentFile } from './types.ts'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

function relationFixture(): ContentFile[] {
  return [
    parseContentFile({
      version: 1,
      type: 'item',
      records: [
        {
          ...head,
          id: 'item:iron',
          type: 'item',
          name: 'Iron',
          category: 'material',
          usedIn: ['recipe:nails'],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'vendor',
      records: [
        {
          ...head,
          id: 'vendor:counter',
          type: 'vendor',
          name: 'Counter',
          shopType: 'smithy',
          inventory: [{ item: 'item:iron' }],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'enemy',
      records: [
        {
          ...head,
          id: 'enemy:boar',
          type: 'enemy',
          name: 'Boar',
          rank: 'common',
          drops: [{ item: 'item:iron' }],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'quest',
      records: [
        {
          ...head,
          id: 'quest:bring-iron',
          type: 'quest',
          name: 'Bring Iron',
          kind: 'side',
          rewards: [{ kind: 'item', ref: 'item:iron' }],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'recipe',
      records: [
        {
          ...head,
          id: 'recipe:nails',
          type: 'recipe',
          name: 'Nails',
          station: 'anvil',
          inputs: [{ item: 'item:iron', qty: 1 }],
          output: { item: 'item:iron', qty: 1 },
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'place',
      records: [
        {
          ...head,
          id: 'place:keep',
          type: 'place',
          name: 'Keep',
          kind: 'castle',
          contains: ['vendor:counter'],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'character',
      records: [
        {
          ...head,
          id: 'character:walker',
          type: 'character',
          name: 'Walker',
          role: 'member',
          factions: ['faction:circle'],
        },
        {
          ...head,
          id: 'character:guest',
          type: 'character',
          name: 'Guest',
          role: 'member',
        },
        {
          ...head,
          id: 'character:chief',
          type: 'character',
          name: 'Chief',
          role: 'leader',
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'faction',
      records: [
        {
          ...head,
          id: 'faction:circle',
          type: 'faction',
          name: 'Circle',
          kind: 'guild',
          leader: 'character:chief',
          members: ['character:guest'],
        },
      ],
    }),
  ]
}

describe('buildContentDb', () => {
  it('indexes every reverse relation from an inline fixture', () => {
    const db = buildContentDb(relationFixture())
    expect([...db.relations.soldBy.entries()]).toEqual([['item:iron', ['vendor:counter']]])
    expect([...db.relations.droppedBy.entries()]).toEqual([['item:iron', ['enemy:boar']]])
    expect([...db.relations.rewardedBy.entries()]).toEqual([['item:iron', ['quest:bring-iron']]])
    expect([...db.relations.usedIn.entries()]).toEqual([['item:iron', ['recipe:nails']]])
    expect([...db.relations.foundIn.entries()]).toEqual([['vendor:counter', ['place:keep']]])
    expect([...db.relations.memberOf.entries()]).toEqual([
      ['character:walker', ['faction:circle']],
      ['character:guest', ['faction:circle']],
      ['character:chief', ['faction:circle']],
    ])
    expect(related(db, 'soldBy', 'item:missing')).toEqual([])
    expect(related(db, 'memberOf', 'character:nope')).toEqual([])
  })

  it('records a dangling inventory ref without throwing', () => {
    const file = parseContentFile({
      version: 1,
      type: 'vendor',
      records: [
        {
          ...head,
          id: 'vendor:ghost',
          type: 'vendor',
          name: 'Ghost',
          shopType: 'smithy',
          inventory: [{ item: 'item:nope' }],
        },
      ],
    })
    expect(() => buildContentDb([file])).not.toThrow()
    expect(related(buildContentDb([file]), 'soldBy', 'item:nope')).toEqual(['vendor:ghost'])
  })

  it('indexes activity rewards on rewardedBy', () => {
    const file = parseContentFile({
      version: 1,
      type: 'activity',
      records: [
        {
          ...head,
          id: 'activity:x',
          type: 'activity',
          name: 'X',
          kind: 'other',
          rewards: [{ kind: 'item', ref: 'item:x' }],
        },
      ],
    })
    expect(related(buildContentDb([file]), 'rewardedBy', 'item:x')).toEqual(['activity:x'])
  })

  it('keeps the first record when an id appears in two files', () => {
    const first = parseContentFile({
      version: 1,
      type: 'item',
      records: [{ ...head, id: 'item:x', type: 'item', name: 'First', category: 'tool' }],
    })
    const second = parseContentFile({
      version: 1,
      type: 'item',
      records: [{ ...head, id: 'item:x', type: 'item', name: 'Second', category: 'weapon' }],
    })
    const db = buildContentDb([first, second])
    expect(db.byId.size).toBe(1)
    expect(db.byId.get('item:x')?.name).toBe('First')
    expect(db.byType.item).toHaveLength(1)
  })
})

