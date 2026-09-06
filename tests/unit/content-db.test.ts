import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContentDb, related } from '../../src/content/db.ts'
import { ENTITY_TYPES } from '../../src/content/ids.ts'
import { parseContentFile, parseMeta } from '../../src/content/schema.ts'

const CONTENT_DIR = 'data/content'

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

describe('buildContentDb', () => {
  it('indexes the committed seeds', () => {
    const meta = parseMeta(readJson(join(CONTENT_DIR, 'meta.json')))
    const files = meta.files.map((name) =>
      parseContentFile(readJson(join(CONTENT_DIR, name)), name),
    )
    const recordCount = files.reduce((n, file) => n + file.records.length, 0)
    const db = buildContentDb(files, meta)

    expect(db.byId.size).toBe(recordCount)
    for (const type of ENTITY_TYPES) expect(db.byType[type], type).toBeDefined()
    const typed = ENTITY_TYPES.reduce((n, type) => n + db.byType[type].length, 0)
    expect(typed).toBe(db.byId.size)

    expect(related(db, 'soldBy', 'item:canta-plate')).toContain('vendor:rhett-hernand')
    expect(related(db, 'droppedBy', 'item:blackwing-mask')).toContain('enemy:crowcaller')
    expect(related(db, 'foundIn', 'vendor:rhett-hernand')).toContain('place:hernand-castle')
    expect(related(db, 'foundIn', 'mount:rokade')).toContain('place:steel-mountains')
    expect(related(db, 'memberOf', 'character:kliff')).toContain('faction:greymanes')
    expect(related(db, 'memberOf', 'character:myurdin')).toContain('faction:black-bears')
  })
})
