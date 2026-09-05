/**
 * Types inferred from the content schemas (docs/DECISIONS.md D12) plus the
 * display labels and the order types appear in search results and the codex.
 */
import type { z } from 'zod'
import type { EntityType } from './ids.ts'
import type {
  AcquisitionSchema,
  ActivitySchema,
  CharacterSchema,
  CollectibleSchema,
  CollectionSchema,
  ContentFileSchema,
  CostSchema,
  EnemySchema,
  EntitySchema,
  FactionSchema,
  GuideSchema,
  ItemSchema,
  LocationSchema,
  MetaSchema,
  MountSchema,
  PlaceSchema,
  PrerequisiteSchema,
  QuestSchema,
  RecipeSchema,
  RegionSchema,
  RewardSchema,
  SkillSchema,
  SourceSchema,
  StepSchema,
  StorylineSchema,
  VendorSchema,
} from './schema.ts'

export type { EntityType } from './ids.ts'

export type ContentLocation = z.output<typeof LocationSchema>
export type Source = z.output<typeof SourceSchema>
export type Cost = z.output<typeof CostSchema>
export type Step = z.output<typeof StepSchema>
export type Prerequisite = z.output<typeof PrerequisiteSchema>
export type Acquisition = z.output<typeof AcquisitionSchema>
export type Reward = z.output<typeof RewardSchema>

export type Region = z.output<typeof RegionSchema>
export type Place = z.output<typeof PlaceSchema>
export type Character = z.output<typeof CharacterSchema>
export type Faction = z.output<typeof FactionSchema>
export type Storyline = z.output<typeof StorylineSchema>
export type Quest = z.output<typeof QuestSchema>
export type Item = z.output<typeof ItemSchema>
export type Collectible = z.output<typeof CollectibleSchema>
export type Collection = z.output<typeof CollectionSchema>
export type Vendor = z.output<typeof VendorSchema>
export type Recipe = z.output<typeof RecipeSchema>
export type Skill = z.output<typeof SkillSchema>
export type Enemy = z.output<typeof EnemySchema>
export type Mount = z.output<typeof MountSchema>
export type Activity = z.output<typeof ActivitySchema>
export type Guide = z.output<typeof GuideSchema>

export type Entity = z.output<typeof EntitySchema>
export type EntityOf<T extends EntityType> = Extract<Entity, { type: T }>
export type ContentFile = z.output<typeof ContentFileSchema>
export type ContentMeta = z.output<typeof MetaSchema>

/** Input shape (what the JSON files contain, before defaults apply). */
export type EntityInput = z.input<typeof EntitySchema>
export type ContentFileInput = z.input<typeof ContentFileSchema>

export const ENTITY_LABELS: Record<EntityType, string> = {
  region: 'Region',
  place: 'Place',
  character: 'Character',
  faction: 'Faction',
  storyline: 'Storyline',
  quest: 'Quest',
  item: 'Item',
  collectible: 'Collectible',
  collection: 'Collection',
  vendor: 'Vendor',
  recipe: 'Recipe',
  skill: 'Skill',
  enemy: 'Enemy',
  mount: 'Mount',
  activity: 'Activity',
  guide: 'Guide',
}

export const ENTITY_PLURALS: Record<EntityType, string> = {
  region: 'Regions',
  place: 'Places',
  character: 'Characters',
  faction: 'Factions',
  storyline: 'Storylines',
  quest: 'Quests',
  item: 'Items',
  collectible: 'Collectibles',
  collection: 'Collections',
  vendor: 'Vendors',
  recipe: 'Recipes',
  skill: 'Skills',
  enemy: 'Enemies',
  mount: 'Mounts',
  activity: 'Activities',
  guide: 'Guides',
}

/** Order for grouped search results and the codex (D15): what a player asks for most, first. */
export const ENTITY_TYPE_ORDER: readonly EntityType[] = [
  'quest',
  'item',
  'place',
  'collectible',
  'mount',
  'character',
  'vendor',
  'enemy',
  'recipe',
  'skill',
  'guide',
  'storyline',
  'faction',
  'collection',
  'activity',
  'region',
]
