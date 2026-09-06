#!/usr/bin/env node
/**
 * Coverage and integrity report for data/content/ (docs/DECISIONS.md D17).
 *
 *     npm run content:report
 *
 * Prints records per type and confidence, unresolved refs and links,
 * records whose gameVersion is behind meta.json, guides and quests without a
 * located step, and collectibles per collection against `total`. Exits 1 when
 * a file fails to parse or a ref is unresolved so it can gate a C-task.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ENTITY_TYPES } from '../src/content/ids.ts'
import { collectRefs, compareGameVersions, parseContentFile, parseMeta } from '../src/content/schema.ts'
import type { ContentFile, Entity } from '../src/content/types.ts'

const CONTENT_DIR = join(process.cwd(), 'data', 'content')

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

function pad(value: string | number, width: number): string {
  return String(value).padStart(width)
}

/** True when the record or anything nested in it (steps, acquisitions) carries a location. */
function hasLocation(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasLocation)
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (typeof obj.x === 'number' && typeof obj.y === 'number' && typeof obj.map === 'string') return true
  return Object.values(obj).some(hasLocation)
}

let failed = false
const meta = parseMeta(readJson(join(CONTENT_DIR, 'meta.json')))
const files: ContentFile[] = []
for (const name of meta.files) {
  try {
    files.push(parseContentFile(readJson(join(CONTENT_DIR, name)), name))
  } catch (error) {
    failed = true
    console.error(error instanceof Error ? error.message : String(error))
  }
}
const records: Entity[] = files.flatMap((file) => file.records)
const ids = new Set(records.map((record) => record.id))

console.log(`Content for ${meta.game.name} ${meta.game.version} (${meta.game.versionDate})`)
console.log(`${records.length} records in ${files.length} files\n`)

console.log(
  `${pad('type', 12)} ${pad('total', 6)} ${pad('verified', 9)} ${pad('reported', 9)} ${pad('assumed', 8)} ${pad('located', 8)}`,
)
for (const type of ENTITY_TYPES) {
  const ofType = records.filter((record) => record.type === type)
  const count = (level: string) => ofType.filter((record) => record.confidence === level).length
  const located = ofType.filter(hasLocation).length
  console.log(
    `${pad(type, 12)} ${pad(ofType.length, 6)} ${pad(count('verified'), 9)} ${pad(count('reported'), 9)} ${pad(count('assumed'), 8)} ${pad(located, 8)}`,
  )
}

const unresolved: string[] = []
for (const record of records) {
  const { refs, links } = collectRefs(record)
  for (const ref of [...refs, ...links]) {
    if (!ids.has(ref)) unresolved.push(`${record.id} -> ${ref}`)
  }
}
console.log(`\nUnresolved refs: ${unresolved.length}`)
for (const line of unresolved) console.log(`  ${line}`)
if (unresolved.length > 0) failed = true

const stale = records.filter(
  (record) => compareGameVersions(record.gameVersion, meta.game.version) < 0,
)
console.log(`\nBehind ${meta.game.version}: ${stale.length}`)
for (const record of stale) console.log(`  ${record.id} (${record.gameVersion})`)

const unlocated = records.filter(
  (record) => (record.type === 'guide' || record.type === 'quest') && !hasLocation(record),
)
console.log(`\nGuides and quests without any location: ${unlocated.length}`)
for (const record of unlocated) console.log(`  ${record.id}`)

const incomplete = records.filter((record) => {
  if (record.type === 'item') return record.acquisitions.length === 0
  if (record.type === 'mount') return record.howToGet.length === 0
  if (record.type === 'skill') return record.howToLearn.length === 0
  if (record.type === 'collectible') return !record.location && !record.guide
  return false
})
console.log(`\nItems, mounts, skills without an acquisition; collectibles without location or guide: ${incomplete.length}`)
for (const record of incomplete) console.log(`  ${record.id}`)

const collections = records.filter((record) => record.type === 'collection')
if (collections.length > 0) {
  console.log('\nCollections:')
  for (const collection of collections) {
    if (collection.type !== 'collection') continue
    const have = records.filter(
      (record) => record.type === 'collectible' && record.collection === collection.id,
    ).length
    const total = collection.total === undefined ? '?' : String(collection.total)
    console.log(`  ${collection.id}: ${have} / ${total}`)
  }
}

if (failed) process.exit(1)
