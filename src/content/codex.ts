/**
 * Codex browse/filter over ContentDb (docs/DECISIONS.md D12, T18).
 * Pure TypeScript; no DOM, React or store.
 */
import type { ContentDb } from './db.ts'
import { SKILL_OWNER_CHARACTER } from './schema.ts'
import { ENTITY_TYPE_ORDER, type Entity, type EntityType } from './types.ts'

export interface FacetValue {
  value: string
  label: string
  count: number
}

export interface Facet {
  id: string
  label: string
  values: FacetValue[]
}

/** One selected value per facet id; a missing key means "any". */
export type FacetSelection = Readonly<Record<string, string>>

export interface FacetSpec {
  id: string
  label: string
  /** Facet values of one record: none, one or several (a character with two factions counts under both). */
  valuesOf: (record: Entity, db: ContentDb) => readonly string[]
  /** Display label of a value; default: the value with `-` and `_` as spaces. */
  labelOf?: (value: string, db: ContentDb) => string
}

const NONE = 'none'

function defaultLabel(value: string): string {
  return value.replace(/[-_]/g, ' ')
}

function facetLabel(spec: FacetSpec, value: string, db: ContentDb): string {
  return spec.labelOf?.(value, db) ?? defaultLabel(value)
}

function optionalOrNone(value: string | undefined): readonly string[] {
  return value === undefined ? [NONE] : [value]
}

function listOrNone(values: readonly string[] | undefined): readonly string[] {
  return values !== undefined && values.length > 0 ? values : [NONE]
}

function recordName(id: string, db: ContentDb): string {
  return db.byId.get(id)?.name ?? defaultLabel(id)
}

function skillOwnerLabel(value: string, db: ContentDb): string {
  if (value === 'shared') return 'Shared'
  if (value === 'kliff' || value === 'damiane' || value === 'oongka') {
    const owner = SKILL_OWNER_CHARACTER[value]
    if (owner === null) return 'Shared'
    return recordName(owner, db)
  }
  return defaultLabel(value)
}

function regionValues(record: Entity, db: ContentDb): readonly string[] {
  if (record.region === undefined) return [NONE]
  const found = db.byId.get(record.region)
  if (found !== undefined && found.type === 'region') return [found.name]
  return [record.region]
}

const REGION_FACET: FacetSpec = {
  id: 'region',
  label: 'Region',
  valuesOf: regionValues,
}

const EXTRA_FACETS: Partial<Record<EntityType, readonly FacetSpec[]>> = {
  item: [
    {
      id: 'category',
      label: 'Category',
      valuesOf: (record) => (record.type === 'item' ? [record.category] : []),
    },
    {
      id: 'rarity',
      label: 'Rarity',
      valuesOf: (record) => (record.type === 'item' ? optionalOrNone(record.rarity) : []),
    },
    {
      id: 'set',
      label: 'Set',
      valuesOf: (record) => (record.type === 'item' ? optionalOrNone(record.setName) : []),
    },
  ],
  enemy: [
    {
      id: 'rank',
      label: 'Rank',
      valuesOf: (record) => (record.type === 'enemy' ? [record.rank] : []),
    },
  ],
  collectible: [
    {
      id: 'collection',
      label: 'Collection',
      valuesOf: (record) => (record.type === 'collectible' ? [record.collection] : []),
      labelOf: recordName,
    },
  ],
  quest: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'quest' ? [record.kind] : []),
    },
    {
      id: 'faction',
      label: 'Faction',
      valuesOf: (record) => (record.type === 'quest' ? optionalOrNone(record.faction) : []),
      labelOf: recordName,
    },
    {
      id: 'storyline',
      label: 'Storyline',
      valuesOf: (record) => (record.type === 'quest' ? optionalOrNone(record.storyline) : []),
      labelOf: recordName,
    },
  ],
  character: [
    {
      id: 'faction',
      label: 'Faction',
      valuesOf: (record) => (record.type === 'character' ? listOrNone(record.factions) : []),
      labelOf: recordName,
    },
    {
      id: 'role',
      label: 'Role',
      valuesOf: (record) => (record.type === 'character' ? [record.role] : []),
    },
  ],
  vendor: [
    {
      id: 'shopType',
      label: 'Shop type',
      valuesOf: (record) => (record.type === 'vendor' ? [record.shopType] : []),
    },
  ],
  place: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'place' ? [record.kind] : []),
    },
  ],
  skill: [
    {
      id: 'character',
      label: 'Character',
      valuesOf: (record) => (record.type === 'skill' ? [record.character] : []),
      labelOf: skillOwnerLabel,
    },
    {
      id: 'tree',
      label: 'Tree',
      valuesOf: (record) => (record.type === 'skill' ? [record.tree] : []),
    },
  ],
  mount: [
    {
      id: 'species',
      label: 'Species',
      valuesOf: (record) => (record.type === 'mount' ? [record.species] : []),
    },
    {
      id: 'legendary',
      label: 'Legendary',
      valuesOf: (record) =>
        record.type === 'mount' ? [record.legendary ? 'yes' : 'no'] : [],
    },
  ],
  recipe: [
    {
      id: 'station',
      label: 'Station',
      valuesOf: (record) => (record.type === 'recipe' ? [record.station] : []),
    },
  ],
  storyline: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'storyline' ? [record.kind] : []),
    },
  ],
  faction: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'faction' ? [record.kind] : []),
    },
  ],
  activity: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'activity' ? [record.kind] : []),
    },
  ],
  region: [
    {
      id: 'kind',
      label: 'Kind',
      valuesOf: (record) => (record.type === 'region' ? [record.kind] : []),
    },
  ],
}

/** Facet definitions per entity type. `region` applies to every type. */
export function facetsFor(type: EntityType): readonly FacetSpec[] {
  return [REGION_FACET, ...(EXTRA_FACETS[type] ?? [])]
}

function matchesSelection(
  record: Entity,
  db: ContentDb,
  specs: readonly FacetSpec[],
  selection: FacetSelection,
  except?: string,
): boolean {
  for (const spec of specs) {
    if (spec.id === except) continue
    const selected = selection[spec.id]
    if (selected === undefined) continue
    if (!spec.valuesOf(record, db).includes(selected)) return false
  }
  return true
}

/**
 * Records of `type` matching every selected facet (AND across facets; a record matches a facet
 * when any of its values equals the selection). Sorted by name (localeCompare).
 */
export function filterCodex(
  db: ContentDb,
  type: EntityType,
  selection: FacetSelection,
): Entity[] {
  const specs = facetsFor(type)
  const matched = db.byType[type].filter((record) =>
    matchesSelection(record, db, specs, selection),
  )
  return matched.sort((a, b) => a.name.localeCompare(b.name))
}

function compareValues(a: FacetValue, b: FacetValue): number {
  if (a.value === NONE && b.value !== NONE) return 1
  if (b.value === NONE && a.value !== NONE) return -1
  return a.label.localeCompare(b.label)
}

/**
 * Facets with counts for `type`. The count of a value is the number of records matching the
 * selections on every OTHER facet that carry the value. Values sorted by label; facets with no
 * value on any record are omitted; `none` is listed last when present.
 */
export function codexFacets(
  db: ContentDb,
  type: EntityType,
  selection: FacetSelection,
): Facet[] {
  const specs = facetsFor(type)
  const records = db.byType[type]
  const facets: Facet[] = []

  for (const spec of specs) {
    const allValues = new Set<string>()
    for (const record of records) {
      for (const value of spec.valuesOf(record, db)) allValues.add(value)
    }
    if (allValues.size === 0) continue

    const counts = new Map<string, number>()
    for (const record of records) {
      if (!matchesSelection(record, db, specs, selection, spec.id)) continue
      const seen = new Set<string>()
      for (const value of spec.valuesOf(record, db)) {
        if (seen.has(value)) continue
        seen.add(value)
        counts.set(value, (counts.get(value) ?? 0) + 1)
      }
    }

    const values: FacetValue[] = []
    for (const value of allValues) {
      values.push({
        value,
        label: facetLabel(spec, value, db),
        count: counts.get(value) ?? 0,
      })
    }
    values.sort(compareValues)
    facets.push({ id: spec.id, label: spec.label, values })
  }

  return facets
}

/** Record count per type in ENTITY_TYPE_ORDER. */
export function codexTypeCounts(db: ContentDb): { type: EntityType; count: number }[] {
  return ENTITY_TYPE_ORDER.map((type) => ({ type, count: db.byType[type].length }))
}
