/**
 * Storyline progress and prerequisite resolution (T17). Pure TypeScript;
 * no DOM, React or store.
 */
import type { ContentDb } from './db.ts'
import type { Prerequisite, Quest, Storyline } from './types.ts'

export interface ChapterProgress {
  title: string
  quests: readonly string[]
  done: number
  total: number
  pointsOfNoReturn: readonly string[]
}

export interface StorylineProgress {
  id: string
  chapters: ChapterProgress[]
  done: number
  total: number
  /** First quest in chapter order that is not done; null when every quest is done or there are none. */
  nextQuestId: string | null
  /** Title of the chapter holding nextQuestId. */
  nextChapterTitle: string | null
}

export function storylineProgress(
  storyline: Storyline,
  doneQuests: ReadonlySet<string>,
): StorylineProgress {
  const chapters: ChapterProgress[] = storyline.chapters.map((chapter) => {
    let done = 0
    for (const id of chapter.quests) {
      if (doneQuests.has(id)) done += 1
    }
    return {
      title: chapter.title,
      quests: chapter.quests,
      done,
      total: chapter.quests.length,
      pointsOfNoReturn: chapter.pointsOfNoReturn ?? [],
    }
  })

  let done = 0
  let total = 0
  let nextQuestId: string | null = null
  let nextChapterTitle: string | null = null
  for (const chapter of chapters) {
    done += chapter.done
    total += chapter.total
    if (nextQuestId === null) {
      const next = chapter.quests.find((id) => !doneQuests.has(id))
      if (next !== undefined) {
        nextQuestId = next
        nextChapterTitle = chapter.title
      }
    }
  }

  return {
    id: storyline.id,
    chapters,
    done,
    total,
    nextQuestId,
    nextChapterTitle,
  }
}

export type PrerequisiteState = 'met' | 'unmet' | 'unknown'

export interface PrerequisiteContext {
  db: ContentDb
  doneQuests: ReadonlySet<string>
  /** The quest whose prerequisites are being judged; used to find its storyline. */
  quest: Quest
}

/**
 * `quest` kind with a ref: met when the ref is done, else unmet.
 * `chapter` kind: resolve the storyline (quest.storyline, else `storyline:main`); a number N
 * means the chapter whose title is `Chapter N` or starts with `Chapter N:` (case-insensitive);
 * a string means the chapter with that exact title. Met when every quest in every earlier
 * chapter is done and the chapter exists; unmet when the chapter exists and some earlier quest
 * is not done; unknown when the storyline or chapter cannot be resolved.
 * Every other kind, and a `quest` kind without a ref: unknown.
 */
export function prerequisiteState(
  prerequisite: Prerequisite,
  ctx: PrerequisiteContext,
): PrerequisiteState {
  if (prerequisite.kind === 'quest') {
    if (prerequisite.ref === undefined) return 'unknown'
    return ctx.doneQuests.has(prerequisite.ref) ? 'met' : 'unmet'
  }

  if (prerequisite.kind !== 'chapter') return 'unknown'

  const storyline = resolveStoryline(ctx)
  if (storyline === null) return 'unknown'

  const index = findChapterIndex(storyline, prerequisite.value)
  if (index < 0) return 'unknown'

  return earlierQuestsDone(storyline, index, ctx.doneQuests) ? 'met' : 'unmet'
}

/** Quest ids referenced by any storyline chapter, for "quests outside a storyline" counts. */
export function questsInStorylines(db: ContentDb): ReadonlySet<string> {
  const ids = new Set<string>()
  for (const entity of db.byType.storyline) {
    if (entity.type !== 'storyline') continue
    for (const chapter of entity.chapters) {
      for (const id of chapter.quests) ids.add(id)
    }
  }
  return ids
}

function resolveStoryline(ctx: PrerequisiteContext): Storyline | null {
  const id = ctx.quest.storyline ?? 'storyline:main'
  const record = ctx.db.byId.get(id)
  if (record === undefined || record.type !== 'storyline') return null
  return record
}

function findChapterIndex(storyline: Storyline, value: string | number | undefined): number {
  if (value === undefined) return -1
  if (typeof value === 'number') {
    const exact = `chapter ${value}`
    const prefix = `${exact}:`
    return storyline.chapters.findIndex((chapter) => {
      const title = chapter.title.trim().toLowerCase()
      return title === exact || title.startsWith(prefix)
    })
  }
  return storyline.chapters.findIndex((chapter) => chapter.title === value)
}

function earlierQuestsDone(
  storyline: Storyline,
  chapterIndex: number,
  doneQuests: ReadonlySet<string>,
): boolean {
  for (let i = 0; i < chapterIndex; i += 1) {
    for (const id of storyline.chapters[i].quests) {
      if (!doneQuests.has(id)) return false
    }
  }
  return true
}
