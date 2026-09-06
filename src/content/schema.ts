/**
 * The content contract (docs/DECISIONS.md D12): zod schemas for every entity
 * type, the per-type content files and `data/content/meta.json`. Types are
 * inferred from these schemas and re-exported by `types.ts`.
 *
 * Rules the schemas enforce: ids are `<type>:<slug>`; every record has a
 * summary, at least one source, a confidence and the game version it was
 * checked against; ref fields hold ids of the right type; locations are
 * canonical zoom-4 pixels (D3) on the Pywel or Abyss map.
 *
 * Do not change these in a T-task; see docs/COMPANION-PLAN.md.
 */
import { z } from 'zod'
import {
  ENTITY_TYPES,
  extractLinks,
  isEntityId,
  parseId,
  SLUG_PATTERN,
  type EntityType,
} from './ids.ts'

export const MAPS = ['pywel', 'abyss'] as const
export const CONFIDENCE_LEVELS = ['verified', 'reported', 'assumed'] as const
export const STEP_ACTIONS = [
  'travel',
  'talk',
  'fight',
  'buy',
  'craft',
  'collect',
  'solve',
  'tame',
  'gather',
  'other',
] as const
export const CURRENCIES = ['copper', 'silver', 'gold-bar', 'contribution', 'other'] as const
export const MISSABLE_LEVELS = ['no', 'easy-to-miss', 'lost-if'] as const
export const PREREQUISITE_KINDS = [
  'quest',
  'chapter',
  'level',
  'reputation',
  'item',
  'skill',
  'other',
] as const
export const ACQUISITION_KINDS = [
  'vendor',
  'drop',
  'quest',
  'chest',
  'craft',
  'gather',
  'tame',
  'event',
  'other',
] as const
export const REWARD_KINDS = ['item', 'money', 'xp', 'reputation', 'unlock', 'other'] as const

export type PrerequisiteKind = (typeof PREREQUISITE_KINDS)[number]
export type AcquisitionKind = (typeof ACQUISITION_KINDS)[number]
export type RewardKind = (typeof REWARD_KINDS)[number]

/**
 * Which entity types `ref` may point at for each kind (R1; the D19 picker
 * filters its id list from these). `null` means any type; an empty list means
 * the kind takes no ref at all.
 */
export const PREREQUISITE_REF_TYPES: Record<PrerequisiteKind, readonly EntityType[] | null> = {
  quest: ['quest'],
  chapter: ['storyline'],
  level: [],
  reputation: ['faction'],
  item: ['item'],
  skill: ['skill'],
  other: null,
}
export const ACQUISITION_REF_TYPES: Record<AcquisitionKind, readonly EntityType[] | null> = {
  vendor: ['vendor'],
  drop: ['enemy'],
  quest: ['quest'],
  chest: ['place', 'collectible', 'collection'],
  craft: ['recipe'],
  gather: ['place'],
  tame: ['place'],
  event: ['activity', 'quest', 'place'],
  other: null,
}
export const REWARD_REF_TYPES: Record<RewardKind, readonly EntityType[] | null> = {
  item: ['item'],
  money: [],
  xp: [],
  reputation: ['faction'],
  unlock: null,
  other: null,
}

export const REGION_KINDS = ['region', 'sub-area', 'layer'] as const
export const PLACE_KINDS = [
  'city',
  'town',
  'village',
  'camp',
  'castle',
  'estate',
  'inn',
  'dungeon',
  'cave',
  'ruins',
  'farm',
  'port',
  'temple',
  'watchtower',
  'shipwreck',
  'sanctum',
  'spire',
  'hidden-place',
  'arena',
  'landmark',
  'other',
] as const
export const FACTION_KINDS = [
  'house',
  'guild',
  'mercenary',
  'hostile',
  'institution',
  'community',
  'other',
] as const
export const STORYLINE_KINDS = ['main', 'faction', 'character', 'side'] as const
export const QUEST_KINDS = [
  'main',
  'faction',
  'commission',
  'request',
  'bounty',
  'challenge',
  'side',
] as const
export const ITEM_CATEGORIES = [
  'weapon',
  'armor',
  'shield',
  'accessory',
  'projectile',
  'consumable',
  'material',
  'tool',
  'key',
  'manual',
  'cosmetic',
  'currency',
  'other',
] as const
export const STATIONS = [
  'cooking',
  'alchemy',
  'anvil',
  'grindstone',
  'sewing',
  'carpentry',
  'other',
] as const
export const SKILL_OWNERS = ['kliff', 'damiane', 'oongka', 'shared'] as const
export type SkillOwner = (typeof SKILL_OWNERS)[number]
/**
 * `Skill.character` is an enum, not a character id (R1: `shared` is not a
 * character). Reverse relations do not join skills to characters; T18 joins
 * through this map when it shows a character's skills.
 */
export const SKILL_OWNER_CHARACTER: Record<SkillOwner, string | null> = {
  kliff: 'character:kliff',
  damiane: 'character:damiane',
  oongka: 'character:oongka',
  shared: null,
}
export const SKILL_TREES = ['stamina', 'spirit', 'health', 'other'] as const
export const ENEMY_RANKS = [
  'common',
  'elite',
  'story-boss',
  'world-boss',
  'legendary-animal',
] as const
/** Challenges are quests of kind `challenge`, not activities. */
export const ACTIVITY_KINDS = ['minigame', 'life-skill', 'contest', 'other'] as const

const gameVersion = z
  .string()
  .regex(/^\d+\.\d+(?:\.\d+)?$/, 'gameVersion must look like 2.01.00')

/** `<type>:<slug>` of a known entity type: the same rule as `parseId` (R1). */
export const IdSchema = z
  .string()
  .refine(isEntityId, 'id must be <type>:<slug> of a known entity type')
  .meta({ entityType: 'any' })

/** Today as YYYY-MM-DD (local time) for the `accessed` upper bound. */
function today(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Compare two gameVersion strings numerically by (major, minor, patch). */
export function compareGameVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/** An id whose type prefix is fixed, e.g. `idOf('quest')` accepts only `quest:...`. */
export function idOf(type: EntityType) {
  return z
    .string()
    .regex(new RegExp(`^${type}:${SLUG_PATTERN}$`), `expected a ${type}:<slug> id`)
    .meta({ entityType: type })
}

/** Refine for `{ kind, ref? }` shapes: `ref` must be a type the kind allows. */
function refMatchesKind<K extends string>(table: Record<K, readonly EntityType[] | null>) {
  return (value: { kind: K; ref?: string }, ctx: z.RefinementCtx) => {
    if (value.ref === undefined) return
    const allowed = table[value.kind]
    if (allowed === null) return
    const type = parseId(value.ref)?.type
    if (allowed.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['ref'], message: `kind ${value.kind} takes no ref` })
    } else if (type === undefined || !allowed.includes(type)) {
      ctx.addIssue({
        code: 'custom',
        path: ['ref'],
        message: `ref for kind ${value.kind} must be a ${allowed.join(' or ')} id`,
      })
    }
  }
}

export const LocationSchema = z.object({
  map: z.enum(MAPS).default('pywel'),
  x: z.number().finite(),
  y: z.number().finite(),
})

export const SourceSchema = z.object({
  url: z.url(),
  title: z.string().min(1).optional(),
  /** YYYY-MM-DD, the day the facts were checked against this source; never in the future. */
  accessed: z.iso.date().refine((date) => date <= today(), 'accessed must not be in the future'),
  note: z.string().optional(),
})

export const CostSchema = z.object({
  currency: z.enum(CURRENCIES),
  amount: z.number().nonnegative(),
})

const lostIfNeedsNote = (value: { missable?: string; missableNote?: string }) =>
  value.missable !== 'lost-if' || (value.missableNote ?? '').length > 0
const LOST_IF_MESSAGE = { message: 'missableNote is required when missable is lost-if', path: ['missableNote'] }

export const StepSchema = z
  .object({
    text: z.string().min(1),
    action: z.enum(STEP_ACTIONS).optional(),
    location: LocationSchema.optional(),
    refs: z.array(IdSchema).optional(),
    cost: CostSchema.optional(),
    missable: z.enum(MISSABLE_LEVELS).optional(),
    /** Required when `missable` is `lost-if`: what loses it. */
    missableNote: z.string().optional(),
    optional: z.boolean().optional(),
  })
  .refine(lostIfNeedsNote, LOST_IF_MESSAGE)

export const PrerequisiteSchema = z
  .object({
    kind: z.enum(PREREQUISITE_KINDS),
    /** Typed by `kind` (PREREQUISITE_REF_TYPES). */
    ref: IdSchema.optional(),
    value: z.union([z.number(), z.string()]).optional(),
    text: z.string().min(1),
  })
  .superRefine(refMatchesKind(PREREQUISITE_REF_TYPES))

export const AcquisitionSchema = z
  .object({
    kind: z.enum(ACQUISITION_KINDS),
    /** The vendor, enemy, quest, place, recipe or collectible this branch goes through; typed by `kind` (ACQUISITION_REF_TYPES). */
    ref: IdSchema.optional(),
    location: LocationSchema.optional(),
    cost: CostSchema.optional(),
    /** Drop or gather chance, 0..1. */
    chance: z.number().min(0).max(1).optional(),
    note: z.string().optional(),
    steps: z.array(StepSchema).optional(),
  })
  .superRefine(refMatchesKind(ACQUISITION_REF_TYPES))

export const RewardSchema = z
  .object({
    kind: z.enum(REWARD_KINDS),
    /** Typed by `kind` (REWARD_REF_TYPES). */
    ref: IdSchema.optional(),
    amount: z.number().optional(),
    text: z.string().optional(),
  })
  .superRefine(refMatchesKind(REWARD_REF_TYPES))

const EntityBase = z.object({
  id: IdSchema,
  type: z.enum(ENTITY_TYPES),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).optional(),
  summary: z.string().min(1).max(240),
  /** Original markdown prose (D13); `[[id]]` links other records. */
  body: z.string().optional(),
  region: idOf('region').optional(),
  location: LocationSchema.optional(),
  tags: z.array(z.string().min(1)).optional(),
  related: z.array(IdSchema).optional(),
  sources: z.array(SourceSchema).min(1),
  confidence: z.enum(CONFIDENCE_LEVELS),
  gameVersion,
})

export const RegionSchema = EntityBase.extend({
  type: z.literal('region'),
  kind: z.enum(REGION_KINDS),
  parent: idOf('region').optional(),
  levelRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  keyPlaces: z.array(idOf('place')).optional(),
})

export const PlaceSchema = EntityBase.extend({
  type: z.literal('place'),
  kind: z.enum(PLACE_KINDS),
  /** Vendors, enemies, collectibles and other records found here. */
  contains: z.array(IdSchema).optional(),
  /** Nearest `data/fast-travel.json` location id, e.g. `nexus:-5040.05:-2774.39`. */
  fastTravel: z.string().min(1).optional(),
})

export const CharacterSchema = EntityBase.extend({
  type: z.literal('character'),
  role: z.string().min(1),
  playable: z.boolean().default(false),
  companion: z.boolean().default(false),
  factions: z.array(idOf('faction')).optional(),
  vendor: idOf('vendor').optional(),
  home: idOf('place').optional(),
  facts: z.array(z.string().min(1)).optional(),
  quests: z.array(idOf('quest')).optional(),
})

export const FactionSchema = EntityBase.extend({
  type: z.literal('faction'),
  kind: z.enum(FACTION_KINDS),
  hostile: z.boolean().default(false),
  leader: idOf('character').optional(),
  members: z.array(idOf('character')).optional(),
  headquarters: idOf('place').optional(),
  reputation: z
    .object({
      tiers: z.array(z.string().min(1)).optional(),
      notes: z.string().min(1),
    })
    .optional(),
  quests: z.array(idOf('quest')).optional(),
})

export const StorylineSchema = EntityBase.extend({
  type: z.literal('storyline'),
  kind: z.enum(STORYLINE_KINDS),
  chapters: z
    .array(
      z.object({
        /** Matches `Quest.chapter` of the quests in it. */
        title: z.string().min(1),
        quests: z.array(idOf('quest')),
        /** What this chapter permanently changes or locks (D16, T17). */
        pointsOfNoReturn: z.array(z.string().min(1)).optional(),
      }),
    )
    .min(1),
  branches: z.array(z.string().min(1)).optional(),
  /** Points of no return not tied to one chapter. */
  pointsOfNoReturn: z.array(z.string().min(1)).optional(),
})

export const QuestSchema = EntityBase.extend({
  type: z.literal('quest'),
  kind: z.enum(QUEST_KINDS),
  /** Chapter title, matching `Storyline.chapters[].title`. */
  chapter: z.string().min(1).optional(),
  storyline: idOf('storyline').optional(),
  giver: idOf('character').optional(),
  faction: idOf('faction').optional(),
  /** Where the quest starts is the common-head `location`; steps carry their own. */
  prerequisites: z.array(PrerequisiteSchema).default([]),
  steps: z.array(StepSchema).default([]),
  rewards: z.array(RewardSchema).default([]),
  unlocks: z.array(IdSchema).optional(),
  missable: z.enum(MISSABLE_LEVELS).default('no'),
  missableNote: z.string().optional(),
  repeatable: z.boolean().default(false),
}).refine(lostIfNeedsNote, LOST_IF_MESSAGE)

export const ItemSchema = EntityBase.extend({
  type: z.literal('item'),
  category: z.enum(ITEM_CATEGORIES),
  slot: z.string().min(1).optional(),
  /** Free text until the tier names are confirmed (docs/RESEARCH-COMPANION.md). */
  rarity: z.string().min(1).optional(),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  acquisitions: z.array(AcquisitionSchema).default([]),
  usedIn: z.array(idOf('recipe')).optional(),
  setName: z.string().min(1).optional(),
})

export const CollectibleSchema = EntityBase.extend({
  type: z.literal('collectible'),
  collection: idOf('collection'),
  index: z.number().int().positive().optional(),
  guide: z.array(StepSchema).optional(),
  reward: RewardSchema.optional(),
})

export const CollectionSchema = EntityBase.extend({
  type: z.literal('collection'),
  total: z.number().int().positive().optional(),
  reward: RewardSchema.optional(),
  /** th.gl type id that marks these on the map, e.g. `memory_fragment` (D14). */
  poiType: z.string().min(1).optional(),
})

export const VendorSchema = EntityBase.extend({
  type: z.literal('vendor'),
  /** th.gl services type id, e.g. `general_shop`, `smithy`, `stable` (D14). */
  shopType: z.string().min(1),
  character: idOf('character').optional(),
  place: idOf('place').optional(),
  inventory: z
    .array(
      z.object({
        item: idOf('item'),
        price: CostSchema.optional(),
        /** Units per restock; omit when unknown. */
        stock: z.number().int().nonnegative().optional(),
        /** True when the line never runs out (then `stock` is omitted). */
        unlimited: z.boolean().optional(),
        unlock: z.string().optional(),
        /** Trust level (0..100) needed before this line appears. */
        trust: z.number().int().min(0).max(100).optional(),
      })
      .refine((line) => !(line.unlimited && line.stock !== undefined), {
        message: 'an unlimited line has no stock count',
        path: ['stock'],
      }),
    )
    .default([]),
  currencies: z.array(z.enum(CURRENCIES)).optional(),
})

export const RecipeSchema = EntityBase.extend({
  type: z.literal('recipe'),
  station: z.enum(STATIONS),
  inputs: z.array(z.object({ item: idOf('item'), qty: z.number().positive() })).min(1),
  output: z.object({ item: idOf('item'), qty: z.number().positive() }),
  learnedFrom: AcquisitionSchema.optional(),
})

export const SkillSchema = EntityBase.extend({
  type: z.literal('skill'),
  character: z.enum(SKILL_OWNERS),
  tree: z.enum(SKILL_TREES),
  prerequisites: z.array(PrerequisiteSchema).default([]),
  howToLearn: z.array(AcquisitionSchema).default([]),
  maxLevel: z.number().int().positive().optional(),
})

export const EnemySchema = EntityBase.extend({
  type: z.literal('enemy'),
  rank: z.enum(ENEMY_RANKS),
  level: z.number().int().positive().optional(),
  drops: z
    .array(z.object({ item: idOf('item'), chance: z.number().min(0).max(1).optional() }))
    .default([]),
  weaknesses: z.array(z.string().min(1)).optional(),
  /** Original markdown (D13). */
  strategy: z.string().optional(),
})

export const MountSchema = EntityBase.extend({
  type: z.literal('mount'),
  species: z.string().min(1),
  legendary: z.boolean().default(false),
  howToGet: z.array(AcquisitionSchema).default([]),
  stats: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
})

export const ActivitySchema = EntityBase.extend({
  type: z.literal('activity'),
  kind: z.enum(ACTIVITY_KINDS),
  rules: z.string().optional(),
  rewards: z.array(RewardSchema).optional(),
  locations: z.array(idOf('place')).optional(),
})

export const GuideSchema = EntityBase.extend({
  type: z.literal('guide'),
  target: IdSchema,
  prerequisites: z.array(PrerequisiteSchema).default([]),
  steps: z.array(StepSchema).min(1),
  repeatable: z.boolean().default(false),
  notes: z.string().optional(),
})

export const EntitySchema = z.discriminatedUnion('type', [
  RegionSchema,
  PlaceSchema,
  CharacterSchema,
  FactionSchema,
  StorylineSchema,
  QuestSchema,
  ItemSchema,
  CollectibleSchema,
  CollectionSchema,
  VendorSchema,
  RecipeSchema,
  SkillSchema,
  EnemySchema,
  MountSchema,
  ActivitySchema,
  GuideSchema,
])

/** One `data/content/<type>.json` file. */
export const ContentFileSchema = z
  .object({
    version: z.literal(1),
    type: z.enum(ENTITY_TYPES),
    records: z.array(EntitySchema),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>()
    file.records.forEach((record, index) => {
      if (record.type !== file.type) {
        ctx.addIssue({
          code: 'custom',
          path: ['records', index, 'type'],
          message: `record ${record.id} is a ${record.type} in a ${file.type} file`,
        })
      }
      if (!record.id.startsWith(`${record.type}:`)) {
        ctx.addIssue({
          code: 'custom',
          path: ['records', index, 'id'],
          message: `id ${record.id} must start with "${record.type}:"`,
        })
      }
      if (seen.has(record.id)) {
        ctx.addIssue({
          code: 'custom',
          path: ['records', index, 'id'],
          message: `duplicate id ${record.id}`,
        })
      }
      seen.add(record.id)
    })
  })

/** `data/content/meta.json` (D17). */
export const MetaSchema = z.object({
  version: z.literal(1),
  game: z.object({
    name: z.string().min(1),
    edition: z.string().min(1).optional(),
    version: gameVersion,
    /** YYYY-MM-DD of that patch. */
    versionDate: z.iso.date(),
    notesUrl: z.url().optional(),
  }),
  expansions: z
    .array(
      z.object({
        name: z.string().min(1),
        date: z.iso.date().optional(),
        status: z.enum(['announced', 'released', 'covered']),
      }),
    )
    .default([]),
  /** Content files relative to `data/content/`, e.g. `quest.json`. */
  files: z.array(z.string().regex(/^[a-z-]+\.json$/)).min(1),
})

function describeError(label: string, error: z.ZodError): Error {
  return new Error(`${label}: ${z.prettifyError(error)}`)
}

export function parseContentFile(value: unknown, label = 'content file') {
  const result = ContentFileSchema.safeParse(value)
  if (!result.success) throw describeError(label, result.error)
  return result.data
}

export function parseMeta(value: unknown, label = 'meta.json') {
  const result = MetaSchema.safeParse(value)
  if (!result.success) throw describeError(label, result.error)
  return result.data
}

export function parseEntity(value: unknown, label = 'entity') {
  const result = EntitySchema.safeParse(value)
  if (!result.success) throw describeError(label, result.error)
  return result.data
}

/**
 * Every id another record is referenced by: whole-string id values anywhere
 * in the record (except its own `id`) plus `[[id]]` links in markdown fields.
 * Used by the data test and the db builder to resolve relations.
 */
export function collectRefs(entity: z.infer<typeof EntitySchema>): {
  refs: string[]
  links: string[]
} {
  const refs: string[] = []
  const links: string[] = []
  const walk = (value: unknown, key: string | undefined) => {
    if (typeof value === 'string') {
      if (key === 'id') return
      // parseId (not the type guard) so the else branch keeps `value` a string.
      if (parseId(value) !== null) refs.push(value)
      else if (value.includes('[[')) links.push(...extractLinks(value))
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item, key)
      return
    }
    if (typeof value === 'object' && value !== null) {
      for (const [k, v] of Object.entries(value)) walk(v, k)
    }
  }
  walk(entity, undefined)
  return { refs, links }
}
