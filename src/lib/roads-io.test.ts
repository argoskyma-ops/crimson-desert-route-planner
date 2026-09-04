import { describe, expect, it } from 'vitest'
import { serializeRoads } from './roads-io'
import { validateRoads } from './roads-loader'
import type { RoadsFile } from '../routing/types'

describe('serializeRoads', () => {
  it('emits one compact node/edge per line with coordinates rounded to 1 decimal', () => {
    const roads: RoadsFile = {
      version: 1,
      imageSize: [5178, 5240],
      nodes: [
        { id: 'n1', x: 1.24, y: 1.25 },
        { id: 'n2', x: 1.26, y: 1.24 },
      ],
      edges: [
        {
          id: 'e1',
          from: 'n1',
          to: 'n2',
          class: 'main',
          points: [
            [1.24, 1.25],
            [1.26, 1.24],
          ],
        },
      ],
    }
    const text = serializeRoads(roads)
    expect(text).toBe(
      [
        '{',
        '  "version": 1,',
        '  "imageSize": [5178, 5240],',
        '  "nodes": [',
        '    {"id":"n1","x":1.2,"y":1.3},',
        '    {"id":"n2","x":1.3,"y":1.2}',
        '  ],',
        '  "edges": [',
        '    {"id":"e1","from":"n1","to":"n2","class":"main","points":[[1.2,1.3],[1.3,1.2]]}',
        '  ]',
        '}',
        '',
      ].join('\n'),
    )
    expect(validateRoads(JSON.parse(text) as unknown)).toEqual({
      version: 1,
      imageSize: [5178, 5240],
      nodes: [
        { id: 'n1', x: 1.2, y: 1.3 },
        { id: 'n2', x: 1.3, y: 1.2 },
      ],
      edges: [
        {
          id: 'e1',
          from: 'n1',
          to: 'n2',
          class: 'main',
          points: [
            [1.2, 1.3],
            [1.3, 1.2],
          ],
        },
      ],
    })
  })
})
