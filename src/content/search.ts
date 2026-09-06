/**
 * In-memory MiniSearch index over content, fast travel and POI types (D15).
 * Pure TypeScript; no DOM, Leaflet or React.
 */
import MiniSearch from 'minisearch'
import {
  FAST_TRAVEL_LABELS,
  FAST_TRAVEL_TYPES,
  type FastTravelType,
} from '../config/travel'
import type { FastTravelLocation } from '../lib/fast-travel-loader'
import type { ContentDb } from './db.ts'
import { isEntityType } from './ids.ts'
import { ENTITY_PLURALS } from './types.ts'

export type SearchKind = 'entity' | 'place' | 'poi-type'
export type MatchTier = 'exact' | 'prefix' | 'fuzzy'

export interface PoiTypeInfo {
  id: string
  label: string
  group: string
}

export interface SearchDoc {
  /** MiniSearch id: `${kind}|${ref}` so a fast-travel `place:pailune` never collides with a content `place:...`. */
  id: string
  kind: SearchKind
  /** Content id, fast-travel id or POI type id. */
  ref: string
  /** Entity type, fast-travel type or POI group id: what the hits are grouped by. */
  type: string
  name: string
  aliases: string[]
  tags: string[]
  summary: string
}

export interface SearchHit {
  kind: SearchKind
  ref: string
  type: string
  name: string
  summary: string
  tier: MatchTier
  score: number
}

export interface SearchGroup {
  type: string
  label: string
  hits: SearchHit[]
}

export type SearchIndex = MiniSearch<SearchDoc>

const TIER_RANK: Record<MatchTier, number> = {
  exact: 0,
  prefix: 1,
  fuzzy: 2,
}

const INDEXED_FIELDS = ['name', 'aliases', 'tags', 'summary', 'type'] as const
const STORED_FIELDS = ['kind', 'ref', 'type', 'name', 'aliases', 'tags', 'summary'] as const

function extractField(document: SearchDoc, fieldName: string): string {
  const value = document[fieldName as keyof SearchDoc]
  if (Array.isArray(value)) return value.join(' ')
  return value == null ? '' : String(value)
}

function isFastTravelType(type: string): type is FastTravelType {
  return (FAST_TRAVEL_TYPES as readonly string[]).includes(type)
}

function groupLabel(type: string): string {
  if (isEntityType(type)) return ENTITY_PLURALS[type]
  if (isFastTravelType(type)) return FAST_TRAVEL_LABELS[type]
  if (type.length === 0) return type
  return type[0].toUpperCase() + type.slice(1)
}

function aliasesOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item))
  if (typeof value === 'string' && value.length > 0) return [value]
  return []
}

function matchTier(name: string, aliases: readonly string[], query: string): MatchTier {
  const q = query.toLowerCase()
  const lowerName = name.toLowerCase()
  const lowerAliases = aliases.map((alias) => alias.toLowerCase())
  if (lowerName === q || lowerAliases.includes(q)) return 'exact'
  if (lowerName.startsWith(q) || lowerAliases.some((alias) => alias.startsWith(q))) {
    return 'prefix'
  }
  if (lowerName.split(/\s+/).some((word) => word.startsWith(q))) return 'prefix'
  return 'fuzzy'
}

function toHit(
  result: { score: number; kind?: unknown; ref?: unknown; type?: unknown; name?: unknown; aliases?: unknown; summary?: unknown },
  query: string,
): SearchHit | null {
  const { kind, ref, type, name } = result
  if (kind !== 'entity' && kind !== 'place' && kind !== 'poi-type') return null
  if (typeof ref !== 'string' || typeof type !== 'string' || typeof name !== 'string') {
    return null
  }
  return {
    kind,
    ref,
    type,
    name,
    summary: typeof result.summary === 'string' ? result.summary : '',
    tier: matchTier(name, aliasesOf(result.aliases), query),
    score: result.score,
  }
}

function compareHits(a: SearchHit, b: SearchHit): number {
  const byTier = TIER_RANK[a.tier] - TIER_RANK[b.tier]
  if (byTier !== 0) return byTier
  if (a.score !== b.score) return b.score - a.score
  return a.name.localeCompare(b.name)
}

function collectDocs(
  db: ContentDb,
  fastTravel: readonly FastTravelLocation[],
  poiTypes: readonly PoiTypeInfo[],
): SearchDoc[] {
  const docs: SearchDoc[] = []
  for (const entity of db.byId.values()) {
    docs.push({
      id: `entity|${entity.id}`,
      kind: 'entity',
      ref: entity.id,
      type: entity.type,
      name: entity.name,
      aliases: entity.aliases ?? [],
      tags: entity.tags ?? [],
      summary: entity.summary,
    })
  }
  for (const loc of fastTravel) {
    docs.push({
      id: `place|${loc.id}`,
      kind: 'place',
      ref: loc.id,
      type: loc.type,
      name: loc.name,
      aliases: [],
      tags: [],
      summary: FAST_TRAVEL_LABELS[loc.type],
    })
  }
  for (const poi of poiTypes) {
    docs.push({
      id: `poi-type|${poi.id}`,
      kind: 'poi-type',
      ref: poi.id,
      type: poi.group,
      name: poi.label,
      aliases: [],
      tags: [poi.id],
      summary: 'Map layer',
    })
  }
  return docs
}

export function buildSearchIndex(
  db: ContentDb,
  fastTravel: readonly FastTravelLocation[],
  poiTypes: readonly PoiTypeInfo[],
): SearchIndex {
  const index = new MiniSearch<SearchDoc>({
    fields: [...INDEXED_FIELDS],
    storeFields: [...STORED_FIELDS],
    extractField,
    searchOptions: {
      prefix: true,
      fuzzy: 0.2,
      combineWith: 'OR',
      boost: { name: 3, aliases: 2 },
    },
  })
  index.addAll(collectDocs(db, fastTravel, poiTypes))
  return index
}

export function search(index: SearchIndex, query: string, limit = 20): SearchGroup[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return []

  const hits: SearchHit[] = []
  for (const result of index.search(trimmed)) {
    const hit = toHit(result, trimmed)
    if (hit !== null) hits.push(hit)
  }
  hits.sort(compareHits)
  const ranked = hits.slice(0, limit)

  const groups: SearchGroup[] = []
  const byType = new Map<string, SearchGroup>()
  for (const hit of ranked) {
    let group = byType.get(hit.type)
    if (group === undefined) {
      group = { type: hit.type, label: groupLabel(hit.type), hits: [] }
      byType.set(hit.type, group)
      groups.push(group)
    }
    group.hits.push(hit)
  }
  return groups
}

export function topHit(groups: SearchGroup[]): SearchHit | null {
  return groups[0]?.hits[0] ?? null
}
