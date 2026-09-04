import { ROAD_CLASSES, type RoadClass, type RoadEdge, type RoadNode, type RoadsFile } from '../routing/types'

export function emptyRoads(imageSize: [number, number]): RoadsFile {
  return { version: 1, imageSize: [imageSize[0], imageSize[1]], nodes: [], edges: [] }
}

/**
 * Fetch `/data/roads.json`. Returns null on 404 or network/parse failure.
 * Invalid shape throws from `validateRoads` with a clear message.
 */
export async function loadRoads(): Promise<RoadsFile | null> {
  let data: unknown
  try {
    const res = await fetch('/data/roads.json')
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  return validateRoads(data)
}

export function validateRoads(value: unknown): RoadsFile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('roads.json: expected an object')
  }
  const raw = value as Record<string, unknown>
  if (raw.version !== 1) {
    throw new Error(`roads.json: version must be 1 (got ${String(raw.version)})`)
  }

  const imageSize = parseImageSize(raw.imageSize)
  if (!Array.isArray(raw.nodes)) {
    throw new Error('roads.json: nodes must be an array')
  }
  if (!Array.isArray(raw.edges)) {
    throw new Error('roads.json: edges must be an array')
  }

  const nodes: RoadNode[] = raw.nodes.map((node, index) => parseNode(node, index))
  const nodeIds = new Set<string>()
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      throw new Error(`roads.json: duplicate node id "${node.id}"`)
    }
    nodeIds.add(node.id)
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const edgeIds = new Set<string>()
  const edges: RoadEdge[] = raw.edges.map((edge, index) => {
    const parsed = parseEdge(edge, index, nodeIds)
    if (edgeIds.has(parsed.id)) {
      throw new Error(`roads.json: duplicate edge id "${parsed.id}"`)
    }
    edgeIds.add(parsed.id)
    const from = nodeById.get(parsed.from)
    const to = nodeById.get(parsed.to)
    if (!from || !to) {
      throw new Error(`roads.json: edge "${parsed.id}" references a missing node`)
    }
    assertEndpoint(parsed.id, 'from', parsed.points[0], from)
    assertEndpoint(parsed.id, 'to', parsed.points[parsed.points.length - 1], to)
    return parsed
  })
  return { version: 1, imageSize, nodes, edges }
}

/** D5: polyline endpoints must match node coords (0.05 px). */
const ENDPOINT_EPS_PX = 0.05

function assertEndpoint(
  edgeId: string,
  which: 'from' | 'to',
  point: [number, number],
  node: RoadNode,
): void {
  const distance = Math.hypot(point[0] - node.x, point[1] - node.y)
  if (distance > ENDPOINT_EPS_PX) {
    throw new Error(
      `roads.json: edge "${edgeId}" ${which === 'from' ? 'first' : 'last'} point must equal ${which} node coordinates`,
    )
  }
}

function parseImageSize(value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !isFiniteNumber(value[0]) ||
    !isFiniteNumber(value[1])
  ) {
    throw new Error('roads.json: imageSize must be [width, height]')
  }
  return [value[0], value[1]]
}

function parseNode(value: unknown, index: number): RoadNode {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`roads.json: node at index ${index} must be an object`)
  }
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`roads.json: node at index ${index} needs a non-empty string id`)
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
    throw new Error(`roads.json: node "${raw.id}" needs numeric x and y`)
  }
  return { id: raw.id, x: raw.x, y: raw.y }
}

function parseEdge(value: unknown, index: number, nodeIds: ReadonlySet<string>): RoadEdge {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`roads.json: edge at index ${index} must be an object`)
  }
  const raw = value as Record<string, unknown>
  const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : `index ${index}`
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`roads.json: edge at index ${index} needs a non-empty string id`)
  }
  if (typeof raw.from !== 'string' || raw.from.length === 0) {
    throw new Error(`roads.json: edge "${id}" needs a string from id`)
  }
  if (typeof raw.to !== 'string' || raw.to.length === 0) {
    throw new Error(`roads.json: edge "${id}" needs a string to id`)
  }
  if (!isRoadClass(raw.class)) {
    throw new Error(`roads.json: edge "${id}" class must be main, sub, or offroad`)
  }
  if (!nodeIds.has(raw.from)) {
    throw new Error(`roads.json: edge "${id}" references missing from node "${raw.from}"`)
  }
  if (!nodeIds.has(raw.to)) {
    throw new Error(`roads.json: edge "${id}" references missing to node "${raw.to}"`)
  }
  const edge: RoadEdge = {
    id: raw.id,
    from: raw.from,
    to: raw.to,
    class: raw.class,
    points: parsePoints(raw.points, id),
  }
  if (raw.bridge === true) edge.bridge = true
  return edge
}

function parsePoints(value: unknown, edgeId: string): [number, number][] {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(`roads.json: edge "${edgeId}" points must be an array of at least 2 [x, y] pairs`)
  }
  return value.map((pair, index) => {
    if (
      !Array.isArray(pair) ||
      pair.length !== 2 ||
      !isFiniteNumber(pair[0]) ||
      !isFiniteNumber(pair[1])
    ) {
      throw new Error(`roads.json: edge "${edgeId}" points[${index}] must be [x, y]`)
    }
    return [pair[0], pair[1]]
  })
}

function isRoadClass(value: unknown): value is RoadClass {
  return typeof value === 'string' && (ROAD_CLASSES as readonly string[]).includes(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
