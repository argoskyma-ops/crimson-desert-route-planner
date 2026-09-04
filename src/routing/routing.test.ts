import { describe, expect, it } from 'vitest'
import { buildGraph } from './graph'
import { findRoute } from './route'
import { snapToRoads } from './snap'
import type { Pt, RoadEdge, RoadNode, RoadsFile } from './types'

function roads(nodes: RoadNode[], edges: RoadEdge[]): RoadsFile {
  return { version: 1, imageSize: [5178, 5240], nodes, edges }
}

function twoNodeRoad(points: [number, number][], roadClass: RoadEdge['class'] = 'main'): RoadsFile {
  const first = points[0]
  const last = points.at(-1) ?? first
  return roads(
    [{ id: 'a', x: first[0], y: first[1] }, { id: 'b', x: last[0], y: last[1] }],
    [{ id: 'road', from: 'a', to: 'b', class: roadClass, points }],
  )
}

describe('buildGraph', () => {
  it('precomputes geometry, topology, and distinct-edge snaps', () => {
    const graph = buildGraph(twoNodeRoad([[0, 0], [3, 4], [6, 4]]))
    expect(graph.edgeById.get('road')?.lengthPx).toBe(8)
    expect(graph.edgeById.get('road')?.cumulativeLengths).toEqual([0, 5, 8])
    expect(graph.adjacency.get('a')).toHaveLength(1)
    expect(snapToRoads(graph, { x: 5, y: 5 }, 4, 10)).toMatchObject([
      { edgeId: 'road', segmentIndex: 1, distancePx: 1 },
    ])
  })

  it('rejects duplicate ids and dangling topology references', () => {
    expect(() => buildGraph(roads(
      [{ id: 'a', x: 0, y: 0 }, { id: 'a', x: 1, y: 1 }],
      [],
    ))).toThrow('Duplicate road node id: "a"')
    expect(() => buildGraph(roads(
      [{ id: 'a', x: 0, y: 0 }],
      [{ id: 'bad', from: 'a', to: 'missing', class: 'main', points: [[0, 0], [1, 0]] }],
    ))).toThrow('Road edge "bad" references missing to node "missing"')
  })
})

describe('findRoute', () => {
  it('follows the road when it is faster', () => {
    const height = Math.sqrt(5_600)
    const graph = buildGraph(twoNodeRoad([[0, 0], [50, height], [100, 0]]))
    const route = findRoute(graph, { x: 0, y: 0 }, { x: 100, y: 0 }, { mode: 'horse' })

    expect(route.legs.map((leg) => leg.edgeId)).toEqual(['road'])
    expect(route.totalPx).toBeCloseTo(180)
  })

  it('uses direct off-road travel when a road detour is too long', () => {
    const graph = buildGraph(twoNodeRoad([[0, 0], [50, 120], [100, 0]]))
    const route = findRoute(graph, { x: 0, y: 0 }, { x: 100, y: 0 }, { mode: 'horse' })

    expect(route.legs).toHaveLength(1)
    expect(route.legs[0]).toMatchObject({ class: 'offroad', lengthPx: 100 })
    expect(route.legs[0].edgeId).toBeUndefined()
  })

  it('can choose a different route for horse and foot modes', () => {
    const height = Math.sqrt(5_600)
    const graph = buildGraph(twoNodeRoad([[0, 0], [50, height], [100, 0]]))
    const horse = findRoute(graph, { x: 0, y: 0 }, { x: 100, y: 0 }, { mode: 'horse' })
    const foot = findRoute(graph, { x: 0, y: 0 }, { x: 100, y: 0 }, { mode: 'foot' })

    expect(horse.legs[0].edgeId).toBe('road')
    expect(foot.legs[0].edgeId).toBeUndefined()
    expect(foot.totalPx).toBe(100)
  })

  it('routes between two projections on the same edge in travel order', () => {
    const graph = buildGraph(twoNodeRoad([[0, 0], [50, 0], [100, 0]]))
    const route = findRoute(graph, { x: 75, y: 0 }, { x: 25, y: 0 }, { mode: 'foot' })

    expect(route.legs).toHaveLength(1)
    expect(route.legs[0].edgeId).toBe('road')
    expect(route.legs[0].lengthPx).toBe(50)
    expect(route.legs[0].points).toEqual([{ x: 75, y: 0 }, { x: 50, y: 0 }, { x: 25, y: 0 }])
  })

  it('returns only the direct off-road route when pins are far from roads', () => {
    const graph = buildGraph(twoNodeRoad([[0, 0], [100, 0]]))
    const route = findRoute(graph, { x: 1_000, y: 1_000 }, { x: 1_100, y: 1_000 }, { mode: 'foot' })

    expect(route.legs).toHaveLength(1)
    expect(route.legs[0]).toMatchObject({ class: 'offroad', lengthPx: 100 })
  })

  it('falls back to direct off-road travel for disconnected road components', () => {
    const graph = buildGraph(roads(
      [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: 100, y: 0 },
        { id: 'b1', x: 1_000, y: 0 },
        { id: 'b2', x: 1_100, y: 0 },
      ],
      [
        { id: 'left', from: 'a1', to: 'a2', class: 'main', points: [[0, 0], [100, 0]] },
        { id: 'right', from: 'b1', to: 'b2', class: 'main', points: [[1_000, 0], [1_100, 0]] },
      ],
    ))
    const route = findRoute(graph, { x: 0, y: 0 }, { x: 1_100, y: 0 }, { mode: 'horse' })

    expect(route.legs).toHaveLength(1)
    expect(route.legs[0]).toMatchObject({ class: 'offroad', lengthPx: 1_100 })
  })

  it('handles an empty graph and coincident pins', () => {
    const graph = buildGraph(roads([], []))
    const direct = findRoute(graph, { x: 1, y: 2 }, { x: 4, y: 6 }, { mode: 'horse' })
    const zero = findRoute(graph, { x: 1, y: 2 }, { x: 1, y: 2 }, { mode: 'foot' })

    expect(direct.totalPx).toBe(5)
    expect(direct.legs).toHaveLength(1)
    expect(zero).toMatchObject({ mode: 'foot', legs: [], totalPx: 0, totalSeconds: 0 })
  })
})

describe('routing performance', () => {
  it('builds and routes across a roughly 20k-node, 40k-edge grid within the sanity budgets', () => {
    const width = 141
    const height = 142
    const spacing = 32
    const nodes: RoadNode[] = []
    const edges: RoadEdge[] = []
    const point = (x: number, y: number): Pt => ({ x: x * spacing, y: y * spacing })
    const id = (x: number, y: number): string => `n${y * width + x}`
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const p = point(x, y)
        nodes.push({ id: id(x, y), ...p })
        if (x > 0) {
          const left = point(x - 1, y)
          edges.push({ id: `h${y}-${x}`, from: id(x - 1, y), to: id(x, y), class: 'main', points: [[left.x, left.y], [p.x, p.y]] })
        }
        if (y > 0) {
          const above = point(x, y - 1)
          edges.push({ id: `v${y}-${x}`, from: id(x, y - 1), to: id(x, y), class: 'main', points: [[above.x, above.y], [p.x, p.y]] })
        }
      }
    }

    const buildStart = performance.now()
    const graph = buildGraph(roads(nodes, edges))
    const buildMs = performance.now() - buildStart
    const routeStart = performance.now()
    const route = findRoute(graph, point(0, 0), point(width - 1, height - 1), { mode: 'horse' })
    const routeMs = performance.now() - routeStart

    expect(nodes).toHaveLength(20_022)
    expect(edges).toHaveLength(39_761)
    expect(route.legs.some((leg) => leg.edgeId !== undefined)).toBe(true)
    expect(buildMs).toBeLessThan(500)
    expect(routeMs).toBeLessThan(100)
  })
})
