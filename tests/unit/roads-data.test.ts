/**
 * Sanity checks on the committed dataset data/roads.json: it must validate,
 * build a graph, and support a road-following route inside its largest
 * connected component. Guards against a broken extraction or editor save.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { validateRoads } from '../../src/lib/roads-loader'
import { buildGraph, findRoute } from '../../src/routing'
import type { Pt, RoadsFile } from '../../src/routing/types'

const roads: RoadsFile = validateRoads(JSON.parse(readFileSync('data/roads.json', 'utf8')))

function largestComponent(r: RoadsFile): Set<string> {
  const parent = new Map<string, string>(r.nodes.map((n) => [n.id, n.id]))
  const find = (id: string): string => {
    let cur = id
    while (parent.get(cur) !== cur) cur = parent.get(cur)!
    return cur
  }
  for (const e of r.edges) {
    const a = find(e.from)
    const b = find(e.to)
    if (a !== b) parent.set(a, b)
  }
  const groups = new Map<string, Set<string>>()
  for (const n of r.nodes) {
    const root = find(n.id)
    if (!groups.has(root)) groups.set(root, new Set())
    groups.get(root)!.add(n.id)
  }
  return [...groups.values()].sort((x, y) => y.size - x.size)[0]
}

describe('data/roads.json', () => {
  it('validates, builds, and has a usable largest component', () => {
    const graph = buildGraph(roads)
    expect(roads.nodes.length).toBeGreaterThan(100)
    expect(roads.edges.length).toBeGreaterThan(100)
    const comp = largestComponent(roads)
    expect(comp.size).toBeGreaterThan(50)
    expect(graph.connectorCount).toBeGreaterThan(0)
  })

  it('routes along roads between two far-apart nodes of the largest component', () => {
    const graph = buildGraph(roads)
    const comp = largestComponent(roads)
    const nodes = roads.nodes.filter((n) => comp.has(n.id))
    // Pick the pair with the largest straight-line separation (deterministic).
    let best: [Pt, Pt] = [nodes[0], nodes[1]]
    let bestD = -1
    for (let i = 0; i < nodes.length; i += 7) {
      for (let j = i + 1; j < nodes.length; j += 7) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y)
        if (d > bestD) {
          bestD = d
          best = [nodes[i], nodes[j]]
        }
      }
    }
    const route = findRoute(graph, best[0], best[1], { mode: 'horse' })
    const roadPx = route.legs.filter((l) => l.edgeId !== undefined).reduce((s, l) => s + l.lengthPx, 0)
    expect(route.totalPx).toBeGreaterThan(0)
    // Both pins sit on road nodes, so the route should be mostly road, not a straight hop.
    expect(roadPx / route.totalPx).toBeGreaterThan(0.6)
    expect(route.legs.length).toBeGreaterThan(3)
  })
})
