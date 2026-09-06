/**
 * Load and validate data/pois.json (docs/DECISIONS.md D14).
 * Missing file: null. Bad JSON: rejects. Bad shape: throws.
 */
import type { PoiTypeInfo } from './search.ts'

export interface PoiType {
  id: string
  label: string
}

export interface PoiGroup {
  id: string
  label: string
  defaultOn: boolean
  category: string
  types: PoiType[]
}

export interface PoiNode {
  id: string
  type: string
  x: number
  y: number
  name?: string
}

export interface PoiFile {
  version: 1
  imageSize: [number, number]
  source: string
  fetched: string
  groups: PoiGroup[]
  nodes: PoiNode[]
}

const FETCHED_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Fetch `/data/pois.json`. Null on 404 or a fetch rejection; a JSON parse
 * failure rejects; validatePois throws on a bad shape.
 */
export async function loadPois(): Promise<PoiFile | null> {
  let res: Response
  try {
    res = await fetch('/data/pois.json')
  } catch {
    return null
  }
  if (!res.ok) return null
  const data: unknown = await res.json()
  return validatePois(data)
}

export function validatePois(value: unknown): PoiFile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('pois.json: expected an object')
  }
  const raw = value as Record<string, unknown>
  if (raw.version !== 1) {
    throw new Error(`pois.json: version must be 1 (got ${String(raw.version)})`)
  }
  const imageSize = parseImageSize(raw.imageSize)
  if (typeof raw.source !== 'string' || raw.source.length === 0) {
    throw new Error('pois.json: source must be a non-empty string')
  }
  if (typeof raw.fetched !== 'string' || !FETCHED_RE.test(raw.fetched)) {
    throw new Error('pois.json: fetched must be YYYY-MM-DD')
  }
  if (!Array.isArray(raw.groups)) {
    throw new Error('pois.json: groups must be an array')
  }
  if (!Array.isArray(raw.nodes)) {
    throw new Error('pois.json: nodes must be an array')
  }

  const groupIds = new Set<string>()
  const typeIds = new Set<string>()
  const groups: PoiGroup[] = []
  for (let index = 0; index < raw.groups.length; index++) {
    groups.push(parseGroup(raw.groups[index], index, groupIds, typeIds))
  }

  const nodeIds = new Set<string>()
  const nodes: PoiNode[] = []
  for (let index = 0; index < raw.nodes.length; index++) {
    const node = parseNode(raw.nodes[index], index, imageSize, typeIds)
    if (nodeIds.has(node.id)) {
      throw new Error(`pois.json: duplicate node id "${node.id}"`)
    }
    nodeIds.add(node.id)
    nodes.push(node)
  }

  return {
    version: 1,
    imageSize,
    source: raw.source,
    fetched: raw.fetched,
    groups,
    nodes,
  }
}

/** Search documents for buildSearchIndex (D15): one per type, `group` = its group id. */
export function poiTypeInfos(file: PoiFile): PoiTypeInfo[] {
  const infos: PoiTypeInfo[] = []
  for (const group of file.groups) {
    for (const type of group.types) {
      infos.push({ id: type.id, label: type.label, group: group.id })
    }
  }
  return infos
}

/** Node count per type id and per group id. */
export function countPois(file: PoiFile): { byType: Map<string, number>; byGroup: Map<string, number> } {
  const typeToGroup = new Map<string, string>()
  const byType = new Map<string, number>()
  const byGroup = new Map<string, number>()
  for (const group of file.groups) {
    byGroup.set(group.id, 0)
    for (const type of group.types) {
      typeToGroup.set(type.id, group.id)
      byType.set(type.id, 0)
    }
  }
  for (const node of file.nodes) {
    byType.set(node.type, (byType.get(node.type) ?? 0) + 1)
    const groupId = typeToGroup.get(node.type)
    if (groupId !== undefined) {
      byGroup.set(groupId, (byGroup.get(groupId) ?? 0) + 1)
    }
  }
  return { byType, byGroup }
}

function parseImageSize(value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !isFiniteNumber(value[0]) ||
    !isFiniteNumber(value[1])
  ) {
    throw new Error('pois.json: imageSize must be [width, height]')
  }
  return [value[0], value[1]]
}

function parseGroup(
  value: unknown,
  index: number,
  groupIds: Set<string>,
  typeIds: Set<string>,
): PoiGroup {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`pois.json: group at index ${index} must be an object`)
  }
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`pois.json: group at index ${index} needs a non-empty string id`)
  }
  if (groupIds.has(raw.id)) {
    throw new Error(`pois.json: duplicate group id "${raw.id}"`)
  }
  groupIds.add(raw.id)
  if (typeof raw.label !== 'string' || raw.label.length === 0) {
    throw new Error(`pois.json: group "${raw.id}" needs a non-empty label`)
  }
  if (typeof raw.defaultOn !== 'boolean') {
    throw new Error(`pois.json: group "${raw.id}" defaultOn must be a boolean`)
  }
  if (typeof raw.category !== 'string') {
    throw new Error(`pois.json: group "${raw.id}" category must be a string`)
  }
  if (!Array.isArray(raw.types)) {
    throw new Error(`pois.json: group "${raw.id}" types must be an array`)
  }
  const types: PoiType[] = []
  for (let typeIndex = 0; typeIndex < raw.types.length; typeIndex++) {
    types.push(parseType(raw.types[typeIndex], typeIndex, raw.id, typeIds))
  }
  return {
    id: raw.id,
    label: raw.label,
    defaultOn: raw.defaultOn,
    category: raw.category,
    types,
  }
}

function parseType(
  value: unknown,
  index: number,
  groupId: string,
  typeIds: Set<string>,
): PoiType {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`pois.json: type at index ${index} of group "${groupId}" must be an object`)
  }
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`pois.json: type at index ${index} of group "${groupId}" needs a non-empty string id`)
  }
  if (typeIds.has(raw.id)) {
    throw new Error(`pois.json: duplicate type id "${raw.id}"`)
  }
  typeIds.add(raw.id)
  if (typeof raw.label !== 'string' || raw.label.length === 0) {
    throw new Error(`pois.json: type "${raw.id}" needs a non-empty label`)
  }
  return { id: raw.id, label: raw.label }
}

function parseNode(
  value: unknown,
  index: number,
  imageSize: [number, number],
  typeIds: Set<string>,
): PoiNode {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`pois.json: node at index ${index} must be an object`)
  }
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`pois.json: node at index ${index} needs a non-empty string id`)
  }
  if (typeof raw.type !== 'string' || !typeIds.has(raw.type)) {
    throw new Error(`pois.json: node "${raw.id}" type is not declared`)
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
    throw new Error(`pois.json: node "${raw.id}" needs numeric x and y`)
  }
  if (raw.x < 0 || raw.y < 0 || raw.x > imageSize[0] || raw.y > imageSize[1]) {
    throw new Error(`pois.json: node "${raw.id}" is outside imageSize`)
  }
  if (raw.name !== undefined) {
    if (typeof raw.name !== 'string' || raw.name.length === 0) {
      throw new Error(`pois.json: node "${raw.id}" name must be a non-empty string`)
    }
    return { id: raw.id, type: raw.type, x: raw.x, y: raw.y, name: raw.name }
  }
  return { id: raw.id, type: raw.type, x: raw.x, y: raw.y }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
