/**
 * The one tunable file for the POI canvas layer. See docs/DECISIONS.md D14.
 */

/** Group toggles at startup. A group not listed here follows th.gl's `defaultOn`. */
export const POI_GROUP_DEFAULTS: Record<string, boolean> = {
  abyss: false, // duplicates the fast-travel overlay until the Phase 6 merge
  treasures: true,
  quests: true,
  exploration: true,
  locations: true,
  services: true,
  crafting: false, // 2,000 stations and bonfires
  gathering: false, // 5,000 plants
  mining: false, // 8,700 ore nodes
}

export function poiGroupDefault(groupId: string, fileDefault: boolean): boolean {
  if (Object.hasOwn(POI_GROUP_DEFAULTS, groupId)) {
    return POI_GROUP_DEFAULTS[groupId] === true
  }
  return fileDefault
}

/** Disc colour per group; POI_FALLBACK_COLOR for a group that is not listed. */
export const POI_GROUP_COLORS: Record<string, string> = {
  abyss: '#c084fc',
  treasures: '#fde047',
  quests: '#fb7185',
  exploration: '#2dd4bf',
  locations: '#a3e635',
  services: '#60a5fa',
  crafting: '#f97316',
  gathering: '#4ade80',
  mining: '#a8a29e',
}

export const POI_FALLBACK_COLOR = '#e5e7eb'

export function poiGroupColor(groupId: string): string {
  return POI_GROUP_COLORS[groupId] ?? POI_FALLBACK_COLOR
}

/** Types whose popup gets a Collected toggle (D14, D16). */
export const POI_CHECKABLE_TYPES: ReadonlySet<string> = new Set([
  'collection_chest',
  'sealed_artifact',
  'abyss_constellation',
  'memory_fragment',
  'greymane_shrine',
  'skill_learning',
  'bell',
])

/** Groups whose every type is checkable (none carry nodes today; th.gl lists them). */
export const POI_CHECKABLE_GROUP_PREFIXES = ['hidden_', 'crafting_manuals'] as const

export function isPoiCheckable(typeId: string, groupId: string): boolean {
  if (POI_CHECKABLE_TYPES.has(typeId)) return true
  for (const prefix of POI_CHECKABLE_GROUP_PREFIXES) {
    if (groupId.startsWith(prefix)) return true
  }
  return false
}

/** Progress key for a collected node (D16 `collected`). */
export function poiProgressKey(nodeId: string): string {
  return `poi:${nodeId}`
}

/** Below this map zoom the layer draws grid-cell counts instead of discs. */
export const POI_CLUSTER_BELOW_ZOOM = 3
export const POI_CLUSTER_CELL_CSS_PX = 64
export const POI_DISC_RADIUS_CSS_PX = 2.5 // a 5 px disc
export const POI_FOCUS_RADIUS_CSS_PX = 6
/** Tap tolerance for opening a node popup. */
export const POI_HIT_RADIUS_CSS_PX = 16
