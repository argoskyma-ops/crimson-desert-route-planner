import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  countPois,
  loadPois,
  poiTypeInfos,
  validatePois,
  type PoiFile,
} from './pois-loader.ts'

function sample(): PoiFile {
  return {
    version: 1,
    imageSize: [100, 80],
    source: 'test',
    fetched: '2026-09-06',
    groups: [
      {
        id: 'mining',
        label: 'Mining',
        defaultOn: false,
        category: 'resources',
        types: [{ id: 'mine_iron', label: 'Iron Mine' }],
      },
      {
        id: 'locations',
        label: 'Locations',
        defaultOn: true,
        category: '',
        types: [{ id: 'camp', label: 'Camp' }],
      },
    ],
    nodes: [
      { id: 'mine_iron@1:2', type: 'mine_iron', x: 10, y: 20 },
      { id: 'camp_380', type: 'camp', x: 11, y: 21, name: 'Pailune Camp' },
    ],
  }
}

function valid(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    version: 1,
    imageSize: [100, 80],
    source: 'test',
    fetched: '2026-09-06',
    groups: [
      {
        id: 'mining',
        label: 'Mining',
        defaultOn: false,
        category: 'resources',
        types: [{ id: 'mine_iron', label: 'Iron Mine' }],
      },
    ],
    nodes: [{ id: 'n1', type: 'mine_iron', x: 10, y: 20 }],
    ...overrides,
  }
}

describe('validatePois', () => {
  it('accepts a minimal file and keeps name only where given', () => {
    const file = validatePois(sample())
    expect(file.nodes).toHaveLength(2)
    expect(file.nodes[0]).not.toHaveProperty('name')
    expect(file.nodes[1]?.name).toBe('Pailune Camp')
  })

  it.each([
    ['a non-object', null, 'expected an object'],
    ['a wrong version', valid({ version: 2 }), 'version must be 1'],
    ['a bad imageSize', valid({ imageSize: [100] }), 'imageSize'],
    ['an empty source', valid({ source: '' }), 'source must be a non-empty string'],
    ['a bad fetched date', valid({ fetched: '06-09-2026' }), 'fetched must be YYYY-MM-DD'],
    ['groups that are not an array', valid({ groups: {} }), 'groups must be an array'],
    ['nodes that are not an array', valid({ nodes: {} }), 'nodes must be an array'],
    [
      'an empty group id',
      valid({
        groups: [
          {
            id: '',
            label: 'Mining',
            defaultOn: false,
            category: '',
            types: [{ id: 'mine_iron', label: 'Iron Mine' }],
          },
        ],
      }),
      'group at index 0 needs a non-empty string id',
    ],
    [
      'an empty group label',
      valid({
        groups: [
          {
            id: 'mining',
            label: '',
            defaultOn: false,
            category: '',
            types: [{ id: 'mine_iron', label: 'Iron Mine' }],
          },
        ],
      }),
      'group "mining" needs a non-empty label',
    ],
    [
      'an empty type id',
      valid({
        groups: [
          {
            id: 'mining',
            label: 'Mining',
            defaultOn: false,
            category: '',
            types: [{ id: '', label: 'Iron Mine' }],
          },
        ],
      }),
      'needs a non-empty string id',
    ],
    [
      'an empty type label',
      valid({
        groups: [
          {
            id: 'mining',
            label: 'Mining',
            defaultOn: false,
            category: '',
            types: [{ id: 'mine_iron', label: '' }],
          },
        ],
      }),
      'type "mine_iron" needs a non-empty label',
    ],
    [
      'a duplicate group id',
      valid({
        groups: [
          {
            id: 'mining',
            label: 'Mining',
            defaultOn: false,
            category: '',
            types: [{ id: 'mine_iron', label: 'Iron Mine' }],
          },
          {
            id: 'mining',
            label: 'Other',
            defaultOn: false,
            category: '',
            types: [{ id: 'mine_copper', label: 'Copper Mine' }],
          },
        ],
      }),
      'duplicate group id',
    ],
    [
      'a duplicate type id',
      valid({
        groups: [
          {
            id: 'mining',
            label: 'Mining',
            defaultOn: false,
            category: '',
            types: [
              { id: 'mine_iron', label: 'Iron Mine' },
              { id: 'mine_iron', label: 'Iron Mine' },
            ],
          },
        ],
      }),
      'duplicate type id',
    ],
    [
      'an empty node id',
      valid({ nodes: [{ id: '', type: 'mine_iron', x: 10, y: 20 }] }),
      'node at index 0 needs a non-empty string id',
    ],
    [
      'an undeclared type',
      valid({ nodes: [{ id: 'n1', type: 'nope', x: 10, y: 20 }] }),
      'type is not declared',
    ],
    [
      'a non-finite coordinate',
      valid({ nodes: [{ id: 'n1', type: 'mine_iron', x: Number.NaN, y: 20 }] }),
      'needs numeric x and y',
    ],
    [
      'an out-of-image coordinate',
      valid({ nodes: [{ id: 'n1', type: 'mine_iron', x: 101, y: 20 }] }),
      'outside imageSize',
    ],
    [
      'an empty name',
      valid({ nodes: [{ id: 'n1', type: 'mine_iron', x: 10, y: 20, name: '' }] }),
      'name must be a non-empty string',
    ],
    [
      'a duplicate node id',
      valid({
        nodes: [
          { id: 'n1', type: 'mine_iron', x: 10, y: 20 },
          { id: 'n1', type: 'mine_iron', x: 11, y: 21 },
        ],
      }),
      'duplicate node id',
    ],
  ] as const)('rejects %s', (_label, value, message) => {
    expect(() => validatePois(value)).toThrow(message)
  })
})

describe('poiTypeInfos / countPois', () => {
  const file = sample()

  it('returns one search document per type in group order', () => {
    expect(poiTypeInfos(file)).toEqual([
      { id: 'mine_iron', label: 'Iron Mine', group: 'mining' },
      { id: 'camp', label: 'Camp', group: 'locations' },
    ])
  })

  it('counts nodes per type and per group', () => {
    const extra: PoiFile = {
      ...file,
      nodes: [
        ...file.nodes,
        { id: 'mine_iron@3:4', type: 'mine_iron', x: 12, y: 22 },
      ],
    }
    const { byType, byGroup } = countPois(extra)
    expect(byType.get('mine_iron')).toBe(2)
    expect(byType.get('camp')).toBe(1)
    expect(byGroup.get('mining')).toBe(2)
    expect(byGroup.get('locations')).toBe(1)
  })
})

describe('loadPois', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns null when fetch resolves with a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }))
    expect(await loadPois()).toBeNull()
  })

  it('returns null when fetch rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')))
    expect(await loadPois()).toBeNull()
  })
})
