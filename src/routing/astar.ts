import { fastestSpeed, METERS_PER_PIXEL } from '../config/travel'
import { dist } from './geometry'
import type { Mode, Pt } from './types'

export interface AStarArc<Node, Step> {
  to: Node
  cost: number
  step: Step
}

export interface AStarResult<Node, Step> {
  nodes: Node[]
  steps: Step[]
  cost: number
}

interface HeapEntry<Node> {
  node: Node
  score: number
  sequence: number
}

class BinaryMinHeap<Node> {
  private readonly entries: HeapEntry<Node>[] = []

  get size(): number {
    return this.entries.length
  }

  push(entry: HeapEntry<Node>): void {
    this.entries.push(entry)
    let index = this.entries.length - 1
    while (index > 0) {
      const parent = (index - 1) >> 1
      if (!this.less(entry, this.entries[parent])) break
      this.entries[index] = this.entries[parent]
      index = parent
    }
    this.entries[index] = entry
  }

  pop(): HeapEntry<Node> | undefined {
    const root = this.entries[0]
    const tail = this.entries.pop()
    if (!root || !tail || this.entries.length === 0) return root

    let index = 0
    while (true) {
      const left = index * 2 + 1
      if (left >= this.entries.length) break
      const right = left + 1
      let child = right < this.entries.length && this.less(this.entries[right], this.entries[left]) ? right : left
      if (!this.less(this.entries[child], tail)) break
      this.entries[index] = this.entries[child]
      index = child
    }
    this.entries[index] = tail
    return root
  }

  private less(left: HeapEntry<Node>, right: HeapEntry<Node>): boolean {
    return left.score < right.score || (left.score === right.score && left.sequence < right.sequence)
  }
}

export function travelTimeHeuristic(from: Pt, to: Pt, mode: Mode): number {
  return (dist(from, to) * METERS_PER_PIXEL) / fastestSpeed(mode)
}

export function astar<Node, Step>(
  start: Node,
  goal: Node,
  neighbors: (node: Node) => readonly AStarArc<Node, Step>[],
  heuristic: (node: Node) => number,
): AStarResult<Node, Step> | null {
  const frontier = new BinaryMinHeap<Node>()
  const costs = new Map<Node, number>([[start, 0]])
  const previous = new Map<Node, { node: Node; step: Step }>()
  let sequence = 0
  frontier.push({ node: start, score: heuristic(start), sequence })

  while (frontier.size > 0) {
    const current = frontier.pop()
    if (!current) break
    const currentCost = costs.get(current.node)
    if (currentCost === undefined || current.score > currentCost + heuristic(current.node) + 1e-9) continue
    if (Object.is(current.node, goal)) return reconstruct(start, goal, currentCost, previous)

    for (const arc of neighbors(current.node)) {
      if (arc.cost < 0 || !Number.isFinite(arc.cost)) continue
      const nextCost = currentCost + arc.cost
      if (nextCost >= (costs.get(arc.to) ?? Number.POSITIVE_INFINITY)) continue
      costs.set(arc.to, nextCost)
      previous.set(arc.to, { node: current.node, step: arc.step })
      sequence += 1
      frontier.push({ node: arc.to, score: nextCost + heuristic(arc.to), sequence })
    }
  }
  return null
}

function reconstruct<Node, Step>(
  start: Node,
  goal: Node,
  cost: number,
  previous: ReadonlyMap<Node, { node: Node; step: Step }>,
): AStarResult<Node, Step> {
  const nodes = [goal]
  const steps: Step[] = []
  let cursor = goal
  while (!Object.is(cursor, start)) {
    const entry = previous.get(cursor)
    if (!entry) break
    steps.push(entry.step)
    cursor = entry.node
    nodes.push(cursor)
  }
  nodes.reverse()
  steps.reverse()
  return { nodes, steps, cost }
}
