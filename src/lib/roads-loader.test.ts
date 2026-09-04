import { describe, expect, it } from 'vitest'
import { validateRoads } from './roads-loader'
import type { RoadsFile } from '../routing/types'

function sample(): RoadsFile {
  return {
    version: 1,
    imageSize: [100, 80],
    nodes: [
      { id: 'n1', x: 0, y: 0 },
      { id: 'n2', x: 10, y: 0 },
    ],
    edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[0, 0], [10, 0]] }],
  }
}

describe('validateRoads', () => {
  it('rejects duplicate edge ids', () => {
    const roads = sample()
    expect(() =>
      validateRoads({
        ...roads,
        edges: [
          roads.edges[0],
          { id: 'e1', from: 'n1', to: 'n2', class: 'sub', points: [[0, 0], [10, 0]] },
        ],
      }),
    ).toThrow('roads.json: duplicate edge id "e1"')
  })

  it('rejects an edge whose endpoints do not match its nodes', () => {
    const roads = sample()
    expect(() =>
      validateRoads({
        ...roads,
        edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[1, 0], [10, 0]] }],
      }),
    ).toThrow(/edge "e1".*from/)

    expect(() =>
      validateRoads({
        ...roads,
        edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[0, 0], [10, 1]] }],
      }),
    ).toThrow(/edge "e1".*to/)
  })

  it('accepts endpoints within 0.05 px and rejects just outside', () => {
    const roads = sample()
    expect(
      validateRoads({
        ...roads,
        edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[0.05, 0], [10, 0.05]] }],
      }).edges[0].points,
    ).toEqual([[0.05, 0], [10, 0.05]])

    expect(() =>
      validateRoads({
        ...roads,
        edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[0.051, 0], [10, 0]] }],
      }),
    ).toThrow(/edge "e1"/)
  })
})
