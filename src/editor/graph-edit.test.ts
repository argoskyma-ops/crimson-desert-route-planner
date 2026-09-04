import { describe, expect, it } from 'vitest'
import {
  addEdge,
  addNode,
  commitDraft,
  deleteEdge,
  findEdge,
  moveNode,
  nextId,
  removeOrphanNodes,
  setEdgeClass,
  splitEdgeAt,
} from './graph-edit'
import type { RoadsFile } from '../routing/types'

function sample(): RoadsFile {
  return {
    version: 1,
    imageSize: [5178, 5240],
    nodes: [
      { id: 'n1', x: 0, y: 0 },
      { id: 'n2', x: 10, y: 0 },
    ],
    edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'main', points: [[0, 0], [10, 0]] }],
  }
}

function snapshot(roads: RoadsFile): RoadsFile {
  return structuredClone(roads)
}

describe('nextId', () => {
  it('increments the numeric suffix per prefix', () => {
    const roads = sample()
    expect(nextId(roads, 'n')).toBe('n3')
    expect(nextId(roads, 'e')).toBe('e2')
    expect(nextId({ ...roads, nodes: [], edges: [] }, 'n')).toBe('n1')
  })

  it('uses the max suffix, not insertion order', () => {
    const roads = sample()
    roads.nodes.push({ id: 'n10', x: 1, y: 1 })
    expect(nextId(roads, 'n')).toBe('n11')
  })
})

describe('addNode', () => {
  it('appends a new node without mutating the original', () => {
    const roads = sample()
    const before = snapshot(roads)
    const next = addNode(roads, { x: 4, y: 7 })
    expect(roads).toEqual(before)
    expect(next.nodes).toHaveLength(3)
    expect(next.nodes.at(-1)).toEqual({ id: 'n3', x: 4, y: 7 })
    expect(next.edges).toBe(roads.edges)
  })
})

describe('addEdge', () => {
  it('appends an edge whose endpoints match the node coords', () => {
    const withNode = addNode(sample(), { x: 0, y: 8 })
    const n3 = withNode.nodes.at(-1)!
    const next = addEdge(withNode, 'n1', n3.id, 'sub', [
      [0, 0],
      [0, 4],
      [0, 8],
    ])
    expect(next.edges.at(-1)).toMatchObject({
      id: 'e2',
      from: 'n1',
      to: n3.id,
      class: 'sub',
    })
    expect(next.edges.at(-1)?.points[0]).toEqual([0, 0])
    expect(next.edges.at(-1)?.points.at(-1)).toEqual([0, 8])
  })

  it('rejects points that do not start and end on the nodes', () => {
    const roads = sample()
    expect(() => addEdge(roads, 'n1', 'n2', 'main', [[1, 0], [10, 0]])).toThrow(
      /first point must match from node/,
    )
    expect(() => addEdge(roads, 'n1', 'n2', 'main', [[0, 0], [10, 1]])).toThrow(
      /last point must match to node/,
    )
    expect(() => addEdge(roads, 'n1', 'n9', 'main', [[0, 0], [1, 1]])).toThrow(/unknown to node/)
  })
})

describe('findEdge', () => {
  it('returns the edge or undefined', () => {
    const roads = sample()
    expect(findEdge(roads, 'e1')?.from).toBe('n1')
    expect(findEdge(roads, 'missing')).toBeUndefined()
  })
})

describe('splitEdgeAt', () => {
  it('creates a node at the projection and replaces the edge with two of the same class', () => {
    const roads = sample()
    const before = snapshot(roads)
    const { roads: next, nodeId } = splitEdgeAt(roads, 'e1', 0, 0.5)
    expect(roads).toEqual(before)
    expect(nodeId).toBe('n3')
    const node = next.nodes.find((item) => item.id === nodeId)
    expect(node).toEqual({ id: 'n3', x: 5, y: 0 })
    expect(findEdge(next, 'e1')).toBeUndefined()
    expect(next.edges).toHaveLength(2)
    expect(next.edges.every((edge) => edge.class === 'main')).toBe(true)
    const left = next.edges.find((edge) => edge.from === 'n1' && edge.to === nodeId)!
    const right = next.edges.find((edge) => edge.from === nodeId && edge.to === 'n2')!
    expect(left.points[0]).toEqual([0, 0])
    expect(left.points.at(-1)).toEqual([5, 0])
    expect(right.points[0]).toEqual([5, 0])
    expect(right.points.at(-1)).toEqual([10, 0])
  })

  it('returns the existing endpoint when t is at an end of the polyline', () => {
    const roads = sample()
    expect(splitEdgeAt(roads, 'e1', 0, 0)).toEqual({ roads, nodeId: 'n1' })
    expect(splitEdgeAt(roads, 'e1', 0, 1)).toEqual({ roads, nodeId: 'n2' })
  })

  it('splits a multi-segment edge on the chosen segment', () => {
    const roads: RoadsFile = {
      version: 1,
      imageSize: [100, 100],
      nodes: [
        { id: 'n1', x: 0, y: 0 },
        { id: 'n2', x: 10, y: 10 },
      ],
      edges: [{ id: 'e1', from: 'n1', to: 'n2', class: 'offroad', points: [[0, 0], [10, 0], [10, 10]] }],
    }
    const { roads: next, nodeId } = splitEdgeAt(roads, 'e1', 1, 0.5)
    const node = next.nodes.find((item) => item.id === nodeId)!
    expect(node).toMatchObject({ x: 10, y: 5 })
    const left = next.edges.find((edge) => edge.to === nodeId)!
    expect(left.points).toEqual([[0, 0], [10, 0], [10, 5]])
    const right = next.edges.find((edge) => edge.from === nodeId)!
    expect(right.points).toEqual([[10, 5], [10, 10]])
    expect(right.class).toBe('offroad')
  })
})

describe('deleteEdge', () => {
  it('removes the edge and leaves nodes in place', () => {
    const roads = sample()
    const before = snapshot(roads)
    const next = deleteEdge(roads, 'e1')
    expect(roads).toEqual(before)
    expect(next.edges).toEqual([])
    expect(next.nodes).toHaveLength(2)
    expect(() => deleteEdge(roads, 'nope')).toThrow(/unknown edge/)
  })
})

describe('setEdgeClass', () => {
  it('updates class without mutating the original', () => {
    const roads = sample()
    const before = snapshot(roads)
    const next = setEdgeClass(roads, 'e1', 'sub')
    expect(roads).toEqual(before)
    expect(findEdge(next, 'e1')?.class).toBe('sub')
    expect(setEdgeClass(next, 'e1', 'sub')).toBe(next)
  })
})

describe('moveNode', () => {
  it('moves the node and matching endpoints of incident edges', () => {
    const roads = sample()
    const extra = addEdge(addNode(roads, { x: 0, y: 6 }), 'n1', 'n3', 'sub', [
      [0, 0],
      [0, 6],
    ])
    const before = snapshot(extra)
    const next = moveNode(extra, 'n1', { x: 2, y: 3 })
    expect(extra).toEqual(before)
    expect(next.nodes.find((node) => node.id === 'n1')).toEqual({ id: 'n1', x: 2, y: 3 })
    const e1 = findEdge(next, 'e1')!
    expect(e1.points[0]).toEqual([2, 3])
    expect(e1.points.at(-1)).toEqual([10, 0])
    const e2 = next.edges.find((edge) => edge.id !== 'e1')!
    expect(e2.points[0]).toEqual([2, 3])
    expect(next.nodes.find((node) => node.id === 'n2')).toEqual({ id: 'n2', x: 10, y: 0 })
  })
})

describe('removeOrphanNodes', () => {
  it('drops nodes that no edge references', () => {
    const roads = sample()
    const withOrphan = addNode(roads, { x: 9, y: 9 })
    expect(removeOrphanNodes(withOrphan).nodes.map((node) => node.id)).toEqual(['n1', 'n2'])
    const emptied = deleteEdge(roads, 'e1')
    expect(removeOrphanNodes(emptied).nodes).toEqual([])
    expect(removeOrphanNodes(roads)).toBe(roads)
  })
})

function expectEndpointsMatchNodes(roads: RoadsFile): void {
  const byId = new Map(roads.nodes.map((node) => [node.id, node]))
  for (const edge of roads.edges) {
    const from = byId.get(edge.from)
    const to = byId.get(edge.to)
    expect(from).toBeDefined()
    expect(to).toBeDefined()
    expect(edge.points[0]).toEqual([from!.x, from!.y])
    expect(edge.points.at(-1)).toEqual([to!.x, to!.y])
  }
}

describe('commitDraft', () => {
  it('reuses a snapped node, splits a snapped edge, and adds the new polyline', () => {
    const roads = sample()
    const next = commitDraft(
      roads,
      [
        { pt: { x: 0, y: 0 }, snap: { nodeId: 'n1' } },
        { pt: { x: 2, y: 8 } },
        { pt: { x: 5, y: 0 }, snap: { edgeId: 'e1', segmentIndex: 0, t: 0.5 } },
      ],
      'sub',
    )
    expect(findEdge(next, 'e1')).toBeUndefined()
    expect(next.nodes.some((node) => node.x === 5 && node.y === 0)).toBe(true)
    const drawn = next.edges.find((edge) => edge.class === 'sub')!
    expect(drawn.from).toBe('n1')
    expect(drawn.points).toEqual([[0, 0], [2, 8], [5, 0]])
    expect(next.edges.filter((edge) => edge.class === 'main')).toHaveLength(2)
    expectEndpointsMatchNodes(next)
  })

  it('emits two edges sharing an interior snapped node from a 4-point draft', () => {
    const roads = sample()
    const next = commitDraft(
      roads,
      [
        { pt: { x: 0, y: 8 } },
        { pt: { x: 0, y: 0 }, snap: { nodeId: 'n1' } },
        { pt: { x: 4, y: 4 } },
        { pt: { x: 8, y: 8 } },
      ],
      'sub',
    )
    const drawn = next.edges.filter((edge) => edge.class === 'sub')
    expect(drawn).toHaveLength(2)
    expect(drawn.every((edge) => edge.from === 'n1' || edge.to === 'n1')).toBe(true)
    const first = drawn.find((edge) => edge.to === 'n1')!
    const second = drawn.find((edge) => edge.from === 'n1')!
    expect(first.points).toEqual([[0, 8], [0, 0]])
    expect(second.points).toEqual([[0, 0], [4, 4], [8, 8]])
    expect(findEdge(next, 'e1')).toBeDefined()
    expectEndpointsMatchNodes(next)
  })

  it('splits an existing edge when an interior draft point snaps to it', () => {
    const roads = sample()
    const beforeCount = roads.edges.length
    const next = commitDraft(
      roads,
      [
        { pt: { x: 5, y: 8 } },
        { pt: { x: 5, y: 0 }, snap: { edgeId: 'e1', segmentIndex: 0, t: 0.5 } },
        { pt: { x: 5, y: -8 } },
      ],
      'sub',
    )
    expect(next.edges).toHaveLength(beforeCount + 3)
    expect(findEdge(next, 'e1')).toBeUndefined()
    expect(next.edges.filter((edge) => edge.class === 'main')).toHaveLength(2)
    const drawn = next.edges.filter((edge) => edge.class === 'sub')
    expect(drawn).toHaveLength(2)
    const split = next.nodes.find((node) => node.x === 5 && node.y === 0)
    expect(split).toBeDefined()
    expect(drawn.every((edge) => edge.from === split!.id || edge.to === split!.id)).toBe(true)
    expectEndpointsMatchNodes(next)
  })
})
