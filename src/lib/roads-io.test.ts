import { describe, expect, it } from 'vitest'
import { serializeRoads } from './roads-io'
import type { RoadsFile } from '../routing/types'

describe('serializeRoads', () => {
  it('pretty-prints JSON with coordinates rounded to 1 decimal', () => {
    const roads: RoadsFile = {
      version: 1,
      imageSize: [5178, 5240],
      nodes: [{ id: 'n1', x: 1.24, y: 1.25 }],
      edges: [
        {
          id: 'e1',
          from: 'n1',
          to: 'n1',
          class: 'main',
          points: [
            [1.24, 1.25],
            [1.26, 1.24],
          ],
        },
      ],
    }
    expect(serializeRoads(roads)).toBe(
      JSON.stringify(
        {
          version: 1,
          imageSize: [5178, 5240],
          nodes: [{ id: 'n1', x: 1.2, y: 1.3 }],
          edges: [
            {
              id: 'e1',
              from: 'n1',
              to: 'n1',
              class: 'main',
              points: [
                [1.2, 1.3],
                [1.3, 1.2],
              ],
            },
          ],
        },
        null,
        2,
      ),
    )
  })
})
