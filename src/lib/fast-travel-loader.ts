import {
  FAST_TRAVEL_LABELS,
  FAST_TRAVEL_SEARCH_RANK,
  FAST_TRAVEL_TYPES,
  type FastTravelType,
} from '../config/travel'

export interface FastTravelLocation {
  id: string
  type: FastTravelType
  name: string
  x: number
  y: number
}

export interface FastTravelFile {
  version: 1
  imageSize: [number, number]
  source: string
  locations: FastTravelLocation[]
}

/**
 * Fetch `/data/fast-travel.json`. Returns null on 404 or network/parse failure.
 * Invalid shape throws from `validateFastTravel`.
 */
export async function loadFastTravel(): Promise<FastTravelFile | null> {
  let data: unknown
  try {
    const res = await fetch('/data/fast-travel.json')
    if (!res.ok) return null
    data = await res.json()
  } catch {
    return null
  }
  return validateFastTravel(data)
}

export function validateFastTravel(value: unknown): FastTravelFile {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('fast-travel.json: expected an object')
  }
  const raw = value as Record<string, unknown>
  if (raw.version !== 1) {
    throw new Error(`fast-travel.json: version must be 1 (got ${String(raw.version)})`)
  }
  const imageSize = parseImageSize(raw.imageSize)
  if (typeof raw.source !== 'string' || raw.source.length === 0) {
    throw new Error('fast-travel.json: source must be a non-empty string')
  }
  if (!Array.isArray(raw.locations)) {
    throw new Error('fast-travel.json: locations must be an array')
  }

  const ids = new Set<string>()
  const locations = raw.locations.map((item, index) => {
    const loc = parseLocation(item, index, imageSize)
    if (ids.has(loc.id)) {
      throw new Error(`fast-travel.json: duplicate id "${loc.id}"`)
    }
    ids.add(loc.id)
    return loc
  })
  return { version: 1, imageSize, source: raw.source, locations }
}

function parseImageSize(value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !isFiniteNumber(value[0]) ||
    !isFiniteNumber(value[1])
  ) {
    throw new Error('fast-travel.json: imageSize must be [width, height]')
  }
  return [value[0], value[1]]
}

function parseLocation(
  value: unknown,
  index: number,
  imageSize: [number, number],
): FastTravelLocation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`fast-travel.json: location at index ${index} must be an object`)
  }
  const raw = value as Record<string, unknown>
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    throw new Error(`fast-travel.json: location at index ${index} needs a non-empty string id`)
  }
  if (!isFastTravelType(raw.type)) {
    throw new Error(
      `fast-travel.json: location "${raw.id}" type must be ${FAST_TRAVEL_TYPES.join(', ')}`,
    )
  }
  if (typeof raw.name !== 'string' || raw.name.length === 0) {
    throw new Error(`fast-travel.json: location "${raw.id}" needs a non-empty name`)
  }
  if (!isFiniteNumber(raw.x) || !isFiniteNumber(raw.y)) {
    throw new Error(`fast-travel.json: location "${raw.id}" needs numeric x and y`)
  }
  if (raw.x < 0 || raw.y < 0 || raw.x > imageSize[0] || raw.y > imageSize[1]) {
    throw new Error(`fast-travel.json: location "${raw.id}" is outside imageSize`)
  }
  return { id: raw.id, type: raw.type, name: raw.name, x: raw.x, y: raw.y }
}

function isFastTravelType(value: unknown): value is FastTravelType {
  return typeof value === 'string' && (FAST_TRAVEL_TYPES as readonly string[]).includes(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Locations whose type is enabled and whose name/type matches `query`. */
export function filterFastTravel(
  locations: readonly FastTravelLocation[],
  enabled: Readonly<Record<FastTravelType, boolean>>,
  query: string,
): FastTravelLocation[] {
  const needle = query.trim().toLowerCase()
  return locations.filter((loc) => {
    if (!enabled[loc.type]) return false
    if (needle.length === 0) return true
    return fastTravelMatches(loc, needle)
  })
}

/** Search hits across every type, so a result can turn its type on. */
export function searchFastTravel(
  locations: readonly FastTravelLocation[],
  query: string,
): FastTravelLocation[] {
  const needle = query.trim().toLowerCase()
  if (needle.length === 0) return []
  return locations
    .filter((loc) => fastTravelMatches(loc, needle))
    .sort((a, b) => {
      const byScore = matchScore(a, needle) - matchScore(b, needle)
      if (byScore !== 0) return byScore
      const byType = FAST_TRAVEL_SEARCH_RANK[a.type] - FAST_TRAVEL_SEARCH_RANK[b.type]
      if (byType !== 0) return byType
      return a.name.localeCompare(b.name)
    })
}

function fastTravelMatches(loc: FastTravelLocation, needle: string): boolean {
  return (
    loc.name.toLowerCase().includes(needle) ||
    FAST_TRAVEL_LABELS[loc.type].toLowerCase().includes(needle) ||
    loc.type.includes(needle)
  )
}

function matchScore(loc: FastTravelLocation, needle: string): number {
  const name = loc.name.toLowerCase()
  if (name === needle) return 0
  if (name.startsWith(needle)) return 1
  if (name.includes(needle)) return 2
  return 3
}
