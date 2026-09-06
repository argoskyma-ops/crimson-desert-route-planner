import { describe, expect, it } from 'vitest'
import { QUEST_KINDS } from '../content/schema'
import {
  applySaveDefaults,
  emptyRecord,
  fieldSpecs,
  serializeContentFile,
  suggestId,
  upsertRecord,
  validateContentFile,
} from './content-io'
import type { ContentFileInput } from '../content/types'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }

function spec(type: 'quest' | 'vendor', key: string) {
  const found = fieldSpecs(type).find((item) => item.key === key)
  if (!found) throw new Error(`missing field ${key}`)
  return found
}

describe('fieldSpecs', () => {
  it('classifies quest fields from the schema', () => {
    expect(spec('quest', 'kind')).toMatchObject({ kind: 'enum', options: QUEST_KINDS })
    expect(spec('quest', 'kind').options).toHaveLength(7)
    expect(spec('quest', 'giver')).toMatchObject({ kind: 'id', entityType: 'character' })
    expect(spec('quest', 'steps').kind).toBe('steps')
    expect(spec('quest', 'location').kind).toBe('location')
    expect(spec('quest', 'rewards').kind).toBe('json')
    expect(spec('quest', 'repeatable')).toMatchObject({ kind: 'boolean', defaultValue: false })
    expect(spec('quest', 'sources').kind).toBe('sources')
  })

  it('classifies vendor inventory as json', () => {
    expect(spec('vendor', 'inventory').kind).toBe('json')
  })
})

describe('emptyRecord', () => {
  it('fails validation with a message naming sources or id', () => {
    const result = validateContentFile({
      version: 1,
      type: 'quest',
      records: [emptyRecord('quest')],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.message).toMatch(/sources|id/)
  })
})

describe('applySaveDefaults', () => {
  it('fills confidence, gameVersion and accessed and drops an empty body', () => {
    const result = applySaveDefaults(
      {
        type: 'quest',
        id: 'quest:x',
        name: 'X',
        summary: 'A summary.',
        body: '',
        kind: 'side',
        sources: [{ url: 'https://example.com/page', accessed: '' }],
      },
      '2.01.00',
      '2026-09-05',
    )
    expect(result.confidence).toBe('verified')
    expect(result.gameVersion).toBe('2.01.00')
    expect(result.body).toBeUndefined()
    expect(result.sources).toEqual([{ url: 'https://example.com/page', accessed: '2026-09-05' }])
  })
})

describe('upsertRecord', () => {
  const existing = {
    id: 'quest:x',
    type: 'quest' as const,
    name: 'X',
    summary: 'A summary.',
    kind: 'side' as const,
    sources: [source],
    confidence: 'reported' as const,
    gameVersion: '2.01.00',
  }
  const file: ContentFileInput = { version: 1, type: 'quest', records: [existing] }

  it('replaces by id and appends new', () => {
    const replaced = upsertRecord(file, { ...existing, name: 'Renamed' })
    expect(replaced.records).toHaveLength(1)
    expect(replaced.records[0]?.name).toBe('Renamed')
    expect(file.records[0]?.name).toBe('X')

    const appended = upsertRecord(file, { ...existing, id: 'quest:y', name: 'Y' })
    expect(appended.records).toHaveLength(2)
    expect(appended.records[1]?.id).toBe('quest:y')
  })
})

describe('serializeContentFile', () => {
  it('round-trips through validateContentFile', () => {
    const file: ContentFileInput = {
      version: 1,
      type: 'quest',
      records: [
        {
          id: 'quest:x',
          type: 'quest',
          name: 'X',
          summary: 'A summary.',
          kind: 'side',
          sources: [source],
          confidence: 'reported',
          gameVersion: '2.01.00',
        },
      ],
    }
    const result = validateContentFile(JSON.parse(serializeContentFile(file)))
    expect(result.ok).toBe(true)
  })
})

describe('suggestId', () => {
  it('slugifies a quest name', () => {
    expect(suggestId('quest', "Rhett's Errand")).toBe('quest:rhetts-errand')
  })
})
