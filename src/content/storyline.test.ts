import { describe, expect, it } from 'vitest'
import { buildContentDb } from './db.ts'
import { parseContentFile } from './schema.ts'
import {
  prerequisiteState,
  questsInStorylines,
  storylineProgress,
  type PrerequisiteContext,
} from './storyline.ts'
import type { ContentFile, Prerequisite, Quest, Storyline } from './types.ts'

const source = { url: 'https://example.com/page', accessed: '2026-09-05' }
const head = {
  summary: 'An example record.',
  sources: [source],
  confidence: 'reported',
  gameVersion: '2.01.00',
} as const

function fixtureFiles(): ContentFile[] {
  return [
    parseContentFile({
      version: 1,
      type: 'storyline',
      records: [
        {
          ...head,
          id: 'storyline:main',
          type: 'storyline',
          name: 'Main story',
          kind: 'main',
          chapters: [
            {
              title: 'Prologue: Opening',
              quests: ['quest:open'],
              pointsOfNoReturn: ['The camp is lost'],
            },
            { title: 'Chapter 1', quests: [] },
            { title: 'Chapter 2', quests: ['quest:winds'] },
            { title: 'Chapter 3: The Peak', quests: ['quest:peak'] },
          ],
        },
        {
          ...head,
          id: 'storyline:side',
          type: 'storyline',
          name: 'Side path',
          kind: 'side',
          chapters: [{ title: 'Errands', quests: ['quest:winds', 'quest:errand'] }],
        },
      ],
    }),
    parseContentFile({
      version: 1,
      type: 'quest',
      records: [
        {
          ...head,
          id: 'quest:open',
          type: 'quest',
          name: 'Opening',
          kind: 'main',
          storyline: 'storyline:main',
        },
        {
          ...head,
          id: 'quest:winds',
          type: 'quest',
          name: 'Winds',
          kind: 'main',
          storyline: 'storyline:main',
          prerequisites: [{ kind: 'chapter', value: 2, text: 'Reach chapter 2' }],
        },
        {
          ...head,
          id: 'quest:peak',
          type: 'quest',
          name: 'Peak',
          kind: 'main',
          storyline: 'storyline:main',
        },
        {
          ...head,
          id: 'quest:errand',
          type: 'quest',
          name: 'Errand',
          kind: 'side',
        },
        {
          ...head,
          id: 'quest:orphan',
          type: 'quest',
          name: 'Orphan',
          kind: 'side',
          storyline: 'storyline:missing',
        },
      ],
    }),
  ]
}

function storyline(id: string): Storyline {
  const record = db.byId.get(id)
  if (record === undefined || record.type !== 'storyline') {
    throw new Error(`missing storyline ${id}`)
  }
  return record
}

function quest(id: string): Quest {
  const record = db.byId.get(id)
  if (record === undefined || record.type !== 'quest') {
    throw new Error(`missing quest ${id}`)
  }
  return record
}

const db = buildContentDb(fixtureFiles())

function ctx(questId: string, done: readonly string[]): PrerequisiteContext {
  return { db, doneQuests: new Set(done), quest: quest(questId) }
}

describe('storylineProgress', () => {
  const campaign = storyline('storyline:main')

  it('skips an empty middle chapter and counts quests across the rest', () => {
    const none = storylineProgress(campaign, new Set())
    expect(none.done).toBe(0)
    expect(none.total).toBe(3)
    expect(none.chapters.map((chapter) => [chapter.title, chapter.done, chapter.total])).toEqual([
      ['Prologue: Opening', 0, 1],
      ['Chapter 1', 0, 0],
      ['Chapter 2', 0, 1],
      ['Chapter 3: The Peak', 0, 1],
    ])
    expect(none.chapters[0].pointsOfNoReturn).toEqual(['The camp is lost'])
    expect(none.nextQuestId).toBe('quest:open')
    expect(none.nextChapterTitle).toBe('Prologue: Opening')

    const afterPrologue = storylineProgress(campaign, new Set(['quest:open']))
    expect(afterPrologue.done).toBe(1)
    expect(afterPrologue.total).toBe(3)
    expect(afterPrologue.nextQuestId).toBe('quest:winds')
    expect(afterPrologue.nextChapterTitle).toBe('Chapter 2')
  })

  it('returns a null next pointer when every quest is done or there are none', () => {
    const allDone = storylineProgress(
      campaign,
      new Set(['quest:open', 'quest:winds', 'quest:peak']),
    )
    expect(allDone.done).toBe(3)
    expect(allDone.nextQuestId).toBeNull()
    expect(allDone.nextChapterTitle).toBeNull()

    const empty = storylineProgress(
      {
        ...campaign,
        id: 'storyline:empty',
        chapters: [
          { title: 'Chapter 1', quests: [] },
          { title: 'Chapter 2', quests: [] },
        ],
      },
      new Set(),
    )
    expect(empty.done).toBe(0)
    expect(empty.total).toBe(0)
    expect(empty.nextQuestId).toBeNull()
    expect(empty.nextChapterTitle).toBeNull()
  })
})

describe('prerequisiteState', () => {
  const winds = ctx('quest:winds', [])

  it('treats a quest ref as met only when that id is done', () => {
    const prereq: Prerequisite = { kind: 'quest', ref: 'quest:open', text: 'Finish opening' }
    expect(prerequisiteState(prereq, winds)).toBe('unmet')
    expect(prerequisiteState(prereq, ctx('quest:winds', ['quest:open']))).toBe('met')
  })

  it('returns unknown for a quest kind without a ref', () => {
    expect(prerequisiteState({ kind: 'quest', text: 'Some quest' }, winds)).toBe('unknown')
  })

  it('resolves a chapter number after earlier quests, and unmet when they are not done', () => {
    const prereq: Prerequisite = { kind: 'chapter', value: 2, text: 'Reach chapter 2' }
    expect(prerequisiteState(prereq, winds)).toBe('unmet')
    expect(prerequisiteState(prereq, ctx('quest:winds', ['quest:open']))).toBe('met')
  })

  it('resolves a chapter by exact title', () => {
    expect(
      prerequisiteState(
        { kind: 'chapter', value: 'Prologue: Opening', text: 'Start the prologue' },
        winds,
      ),
    ).toBe('met')
    const chapter2: Prerequisite = { kind: 'chapter', value: 'Chapter 2', text: 'Chapter 2' }
    expect(prerequisiteState(chapter2, winds)).toBe('unmet')
    expect(prerequisiteState(chapter2, ctx('quest:winds', ['quest:open']))).toBe('met')
  })

  it('matches a Chapter N: title for a numeric chapter prerequisite', () => {
    const prereq: Prerequisite = { kind: 'chapter', value: 3, text: 'Reach chapter 3' }
    expect(prerequisiteState(prereq, ctx('quest:winds', ['quest:open']))).toBe('unmet')
    expect(prerequisiteState(prereq, ctx('quest:winds', ['quest:open', 'quest:winds']))).toBe(
      'met',
    )
  })

  it('returns unknown when the storyline or chapter cannot be resolved', () => {
    expect(
      prerequisiteState(
        { kind: 'chapter', value: 2, text: 'Reach chapter 2' },
        ctx('quest:orphan', []),
      ),
    ).toBe('unknown')
    expect(
      prerequisiteState({ kind: 'chapter', value: 'No Such Chapter', text: 'Missing' }, winds),
    ).toBe('unknown')
  })

  it('returns unknown for a level kind', () => {
    expect(prerequisiteState({ kind: 'level', value: 10, text: 'Level 10' }, winds)).toBe('unknown')
  })
})

describe('questsInStorylines', () => {
  it('collects quest ids across storylines without duplicates', () => {
    expect([...questsInStorylines(db)].sort()).toEqual(
      ['quest:errand', 'quest:open', 'quest:peak', 'quest:winds'].sort(),
    )
  })
})
