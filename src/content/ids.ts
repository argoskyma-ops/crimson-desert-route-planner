/**
 * Id and slug rules for content records (docs/DECISIONS.md D12).
 *
 * An id is `<type>:<slug>`: the entity type, a colon, and a kebab-case ASCII
 * slug. Ids are stable: when the game renames something, keep the id, change
 * `name`, and add the old name to `aliases`.
 *
 * Imports inside `src/content/` carry the `.ts` extension so the module also
 * runs under plain `node` (scripts/content-report.ts) without a bundler.
 */

export const ENTITY_TYPES = [
  'region',
  'place',
  'character',
  'faction',
  'storyline',
  'quest',
  'item',
  'collectible',
  'collection',
  'vendor',
  'recipe',
  'skill',
  'enemy',
  'mount',
  'activity',
  'guide',
] as const
export type EntityType = (typeof ENTITY_TYPES)[number]

export const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*'
export const SLUG_RE = new RegExp(`^${SLUG_PATTERN}$`)
export const ID_RE = new RegExp(`^([a-z]+):(${SLUG_PATTERN})$`)
/** `[[type:slug]]` links inside markdown bodies (D16). */
export const LINK_RE = new RegExp(`\\[\\[([a-z]+:${SLUG_PATTERN})\\]\\]`, 'g')

export function isEntityType(value: unknown): value is EntityType {
  return typeof value === 'string' && (ENTITY_TYPES as readonly string[]).includes(value)
}

export interface ParsedId {
  type: EntityType
  slug: string
}

/** Split an id into type and slug; null when it is not a well-formed id of a known type. */
export function parseId(id: string): ParsedId | null {
  const match = ID_RE.exec(id)
  if (!match) return null
  const type = match[1]
  if (!isEntityType(type)) return null
  return { type, slug: match[2] }
}

export function isEntityId(value: unknown): value is string {
  return typeof value === 'string' && parseId(value) !== null
}

export function makeId(type: EntityType, slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error(`invalid slug "${slug}"`)
  return `${type}:${slug}`
}

/** Display name -> slug: lower-case ASCII, diacritics stripped, runs of other characters become "-". */
export function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Every `[[id]]` link in a markdown string, in order, duplicates kept. */
export function extractLinks(markdown: string): string[] {
  const out: string[] = []
  for (const match of markdown.matchAll(LINK_RE)) out.push(match[1])
  return out
}
