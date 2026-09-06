import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildContentDb } from '../../src/content/db.ts'
import { parseContentFile, parseMeta } from '../../src/content/schema.ts'
import { buildSearchIndex, search, topHit } from '../../src/content/search.ts'

const CONTENT_DIR = 'data/content'

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown
}

describe('content search seeds', () => {
  it('finds mount:rokade for "rokade"', () => {
    const meta = parseMeta(readJson(join(CONTENT_DIR, 'meta.json')))
    const files = meta.files.map((name) =>
      parseContentFile(readJson(join(CONTENT_DIR, name)), name),
    )
    const db = buildContentDb(files, meta)
    const index = buildSearchIndex(db, [], [])
    const hit = topHit(search(index, 'rokade'))
    expect(hit?.ref).toBe('mount:rokade')
    expect(hit?.kind).toBe('entity')
    expect(hit?.tier).toBe('exact')
  })
})
