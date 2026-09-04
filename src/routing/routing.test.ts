import { describe, expect, it } from 'vitest'
import { CONNECTOR_MAX, CONNECTOR_RADIUS_PX, SPEED_MPS } from '../config/travel'
import { buildGraph } from './graph'
import { findRoute } from './route'
import { snapToRoads } from './snap'
import type { Mode, Pt, RoadEdge, RoadNode, RoadsFile } from './types'

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

function breakEvenRatio(mode: Mode): number {
  return SPEED_MPS[mode].main / SPEED_MPS[mode].offroad
}

/** Isosceles two-segment road from (0,0) to (`straight`, 0) with the given polyline length. */
function detourRoad(straight: number, roadLength: number, roadClass: RoadEdge['class'] = 'main'): RoadsFile {
  const half = straight / 2
  const halfLen = roadLength / 2
  const height = Math.sqrt(halfLen * halfLen - half * half)
  return twoNodeRoad([[0, 0], [half, height], [straight, 0]], roadClass)
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

  it('joins nearby disconnected fragments with an off-road connector hop', () => {
    const graph = buildGraph(roads(
      [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: 100, y: 0 },
        { id: 'b1', x: 150, y: 0 },
        { id: 'b2', x: 250, y: 0 },
      ],
      [
        { id: 'left', from: 'a1', to: 'a2', class: 'main', points: [[0, 0], [100, 0]] },
        { id: 'right', from: 'b1', to: 'b2', class: 'main', points: [[150, 0], [250, 0]] },
      ],
    ))

    expect(graph.connectorCount).toBeGreaterThan(0)
    expect(graph.roads.edges.map((edge) => edge.id)).toEqual(['left', 'right'])
    expect(graph.adjacency.get('a2')?.some((arc) => arc.toNodeId === 'b1' && arc.edgeId === undefined)).toBe(true)

    const route = findRoute(graph, { x: 0, y: 0 }, { x: 250, y: 0 }, { mode: 'horse' })
    expect(route.legs.map((leg) => ({ class: leg.class, edgeId: leg.edgeId }))).toEqual([
      { class: 'main', edgeId: 'left' },
      { class: 'offroad', edgeId: undefined },
      { class: 'main', edgeId: 'right' },
    ])
    expect(route.legs[1]?.points).toEqual([{ x: 100, y: 0 }, { x: 150, y: 0 }])
    expect(route.legs[1]?.lengthPx).toBe(50)
  })

  it('does not join fragments farther than the connector radius', () => {
    const graph = buildGraph(roads(
      [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: 100, y: 0 },
        { id: 'b1', x: 600, y: 0 },
        { id: 'b2', x: 700, y: 0 },
      ],
      [
        { id: 'left', from: 'a1', to: 'a2', class: 'main', points: [[0, 0], [100, 0]] },
        { id: 'right', from: 'b1', to: 'b2', class: 'main', points: [[600, 0], [700, 0]] },
      ],
    ))
    expect(600 - 100).toBeGreaterThan(CONNECTOR_RADIUS_PX)
    expect(graph.connectorCount).toBe(0)

    const route = findRoute(graph, { x: 0, y: 0 }, { x: 700, y: 0 }, { mode: 'horse' })
    expect(route.legs).toHaveLength(1)
    expect(route.legs[0]?.class).toBe('offroad')
    expect(route.legs[0]?.edgeId).toBeUndefined()
  })

  it('does not create connectors between already-adjacent nodes', () => {
    const graph = buildGraph(twoNodeRoad([[0, 0], [50, 0]]))
    expect(graph.connectorCount).toBe(0)
    expect(graph.adjacency.get('a')).toHaveLength(1)
    expect(graph.adjacency.get('b')).toHaveLength(1)
    expect(graph.adjacency.get('a')?.[0]?.edgeId).toBe('road')
  })

  it('caps connectors at CONNECTOR_MAX and prefers other components', () => {
    const graph = buildGraph(roads(
      [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: 0, y: 40 },
        { id: 'a3', x: 20, y: 0 },
        { id: 'a4', x: 40, y: 0 },
        { id: 'b', x: 50, y: 0 },
        { id: 'c', x: 60, y: 0 },
        { id: 'd', x: 70, y: 0 },
        { id: 'e', x: 80, y: 0 },
      ],
      [
        { id: 'spine', from: 'a1', to: 'a2', class: 'sub', points: [[0, 0], [0, 40]] },
        { id: 'fold', from: 'a2', to: 'a3', class: 'sub', points: [[0, 40], [20, 0]] },
        { id: 'tail', from: 'a3', to: 'a4', class: 'sub', points: [[20, 0], [40, 0]] },
      ],
    ))

    const fromA1 = graph.adjacency.get('a1') ?? []
    const connectorTargets = fromA1.filter((arc) => arc.edgeId === undefined).map((arc) => arc.toNodeId).sort()
    expect(connectorTargets).toHaveLength(CONNECTOR_MAX)
    expect(connectorTargets).toEqual(['b', 'c', 'd'])
    expect(connectorTargets).not.toContain('a3')
    expect(connectorTargets).not.toContain('e')
  })

  it('skips connector generation when buildGraph options disable them', () => {
    const source = roads(
      [
        { id: 'a1', x: 0, y: 0 },
        { id: 'a2', x: 100, y: 0 },
        { id: 'b1', x: 150, y: 0 },
        { id: 'b2', x: 250, y: 0 },
      ],
      [
        { id: 'left', from: 'a1', to: 'a2', class: 'main', points: [[0, 0], [100, 0]] },
        { id: 'right', from: 'b1', to: 'b2', class: 'main', points: [[150, 0], [250, 0]] },
      ],
    )
    const graph = buildGraph(source, { connectors: false })
    expect(graph.connectorCount).toBe(0)
    expect(graph.adjacency.get('a2')).toHaveLength(1)
    expect(graph.adjacency.get('a2')?.[0]?.edgeId).toBe('left')
    expect(graph.adjacency.get('a2')?.some((arc) => arc.edgeId === undefined)).toBe(false)
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
    const straight = 100
    const breakEven = straight * breakEvenRatio('horse')
    const graph = buildGraph(detourRoad(straight, 0.8 * breakEven))
    const route = findRoute(graph, { x: 0, y: 0 }, { x: straight, y: 0 }, { mode: 'horse' })

    expect(route.legs.map((leg) => leg.edgeId)).toEqual(['road'])
    expect(route.totalPx).toBeCloseTo(0.8 * breakEven)
  })

  it('uses direct off-road travel when a road detour is too long', () => {
    const straight = 100
    const breakEven = straight * breakEvenRatio('horse')
    const graph = buildGraph(detourRoad(straight, 1.3 * breakEven))
    const route = findRoute(graph, { x: 0, y: 0 }, { x: straight, y: 0 }, { mode: 'horse' })

    expect(route.legs).toHaveLength(1)
    expect(route.legs[0]).toMatchObject({ class: 'offroad', lengthPx: straight })
    expect(route.legs[0].edgeId).toBeUndefined()
  })

  it('can choose a different route for horse and foot modes', () => {
    const horseBreak = breakEvenRatio('horse')
    const footBreak = breakEvenRatio('foot')
    expect(footBreak).toBeLessThan(horseBreak)
    const ratio = (footBreak + horseBreak) / 2
    const straight = 100
    const graph = buildGraph(detourRoad(straight, ratio * straight))
    const horse = findRoute(graph, { x: 0, y: 0 }, { x: straight, y: 0 }, { mode: 'horse' })
    const foot = findRoute(graph, { x: 0, y: 0 }, { x: straight, y: 0 }, { mode: 'foot' })

    expect(horse.legs[0].edgeId).toBe('road')
    expect(foot.legs[0].edgeId).toBeUndefined()
    expect(foot.totalPx).toBe(straight)
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
    expect(graph.connectorCount).toBe(0)
    expect(route.legs.some((leg) => leg.edgeId !== undefined)).toBe(true)
    expect(buildMs).toBeLessThan(500)
    expect(routeMs).toBeLessThan(100)
  })
})
