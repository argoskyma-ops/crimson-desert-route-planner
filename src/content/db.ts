/**
 * In-memory content index (docs/DECISIONS.md D16): byId, byType and reverse
 * relations so the entity panel never scans. Pure TypeScript; no fetch.
 */
import { ENTITY_TYPES, type EntityType } from './ids.ts'
import type { ContentFile, ContentMeta, Entity } from './types.ts'

export type RelationName =
  | 'soldBy'
  | 'droppedBy'
  | 'rewardedBy'
  | 'usedIn'
  | 'foundIn'
  | 'memberOf'

const RELATION_NAMES = [
  'soldBy',
  'droppedBy',
  'rewardedBy',
  'usedIn',
  'foundIn',
  'memberOf',
] as const satisfies readonly RelationName[]

const NONE: readonly string[] = []

export interface ContentDb {
  meta: ContentMeta | null
  byId: ReadonlyMap<string, Entity>
  /** Every entity type is a key, in file order; empty array when a type has no records. */
  byType: Readonly<Record<EntityType, readonly Entity[]>>
  /** Reverse relations, target id -> source ids, insertion order, no duplicates. */
  relations: Readonly<Record<RelationName, ReadonlyMap<string, readonly string[]>>>
}

type MutableRelations = Record<RelationName, Map<string, string[]>>

function emptyByType(): Record<EntityType, Entity[]> {
  const byType = {} as Record<EntityType, Entity[]>
  for (const type of ENTITY_TYPES) byType[type] = []
  return byType
}

function emptyRelations(): MutableRelations {
  const relations = {} as MutableRelations
  for (const name of RELATION_NAMES) relations[name] = new Map()
  return relations
}

export function emptyContentDb(meta?: ContentMeta | null): ContentDb {
  return {
    meta: meta ?? null,
    byId: new Map(),
    byType: emptyByType(),
    relations: emptyRelations(),
  }
}

export function buildContentDb(
  files: readonly ContentFile[],
  meta?: ContentMeta | null,
): ContentDb {
  const byId = new Map<string, Entity>()
  const byType = emptyByType()
  for (const file of files) {
    for (const record of file.records) {
      if (byId.has(record.id)) continue
      byId.set(record.id, record)
      byType[record.type].push(record)
    }
  }

  const relations = emptyRelations()
  for (const entity of byId.values()) indexRelations(relations, entity)

  return { meta: meta ?? null, byId, byType, relations }
}

/** Convenience: source ids for one relation, `[]` when none. */
export function related(db: ContentDb, name: RelationName, id: string): readonly string[] {
  return db.relations[name].get(id) ?? NONE
}

function add(map: Map<string, string[]>, target: string, source: string): void {
  const existing = map.get(target)
  if (existing === undefined) {
    map.set(target, [source])
    return
  }
  if (!existing.includes(source)) existing.push(source)
}

function indexRelations(relations: MutableRelations, entity: Entity): void {
  switch (entity.type) {
    case 'vendor':
      for (const line of entity.inventory) add(relations.soldBy, line.item, entity.id)
      return
    case 'enemy':
      for (const drop of entity.drops) add(relations.droppedBy, drop.item, entity.id)
      return
    case 'quest':
      for (const reward of entity.rewards) {
        if (reward.ref !== undefined) add(relations.rewardedBy, reward.ref, entity.id)
      }
      return
    case 'activity':
      for (const reward of entity.rewards ?? []) {
        if (reward.ref !== undefined) add(relations.rewardedBy, reward.ref, entity.id)
      }
      return
    case 'collectible':
      if (entity.reward?.ref !== undefined) {
        add(relations.rewardedBy, entity.reward.ref, entity.id)
      }
      return
    case 'collection':
      if (entity.reward?.ref !== undefined) {
        add(relations.rewardedBy, entity.reward.ref, entity.id)
      }
      return
    case 'recipe':
      for (const input of entity.inputs) add(relations.usedIn, input.item, entity.id)
      return
    case 'item':
      for (const recipeId of entity.usedIn ?? []) add(relations.usedIn, entity.id, recipeId)
      return
    case 'place':
      for (const contained of entity.contains ?? []) add(relations.foundIn, contained, entity.id)
      return
    case 'character':
      for (const factionId of entity.factions ?? []) add(relations.memberOf, entity.id, factionId)
      return
    case 'faction':
      for (const memberId of entity.members ?? []) add(relations.memberOf, memberId, entity.id)
      if (entity.leader !== undefined) add(relations.memberOf, entity.leader, entity.id)
      return
    default:
      return
  }
}
