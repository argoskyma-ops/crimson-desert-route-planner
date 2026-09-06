import { useMemo } from 'react'
import {
  questsInStorylines,
  storylineProgress,
  type StorylineProgress,
} from '../content/storyline'
import type { ContentDb } from '../content/db'
import type { Quest, Storyline } from '../content/types'
import { useAppStore } from '../store'
import EntityLink from './entity/EntityLink'
import { PanelButton, Section } from './entity/Section'

const OTHER_QUEST_CAP = 20
const FACTION_STORYLINE_KINDS = new Set(['faction', 'character', 'side'])

function ProgressBar({ done, total }: { done: number; total: number }) {
  const percent = total === 0 ? 0 : (done / total) * 100
  return (
    <div className="h-1.5 rounded bg-neutral-800">
      <div className="h-1.5 rounded bg-sky-400" style={{ width: `${percent}%` }} />
    </div>
  )
}

function asStorylines(db: ContentDb): Storyline[] {
  return db.byType.storyline.filter((record): record is Storyline => record.type === 'storyline')
}

function asQuests(db: ContentDb): Quest[] {
  return db.byType.quest.filter((record): record is Quest => record.type === 'quest')
}

function factionGroups(db: ContentDb, storylines: readonly Storyline[]) {
  const grouped = new Map<string, Storyline[]>()
  for (const record of storylines) {
    if (!FACTION_STORYLINE_KINDS.has(record.kind)) continue
    const region = record.region !== undefined ? db.byId.get(record.region) : undefined
    const key = region?.type === 'region' ? region.id : ''
    const list = grouped.get(key)
    if (list) list.push(record)
    else grouped.set(key, [record])
  }

  const groups: { title: string; storylines: Storyline[] }[] = []
  for (const region of db.byType.region) {
    const list = grouped.get(region.id)
    if (list === undefined || list.length === 0) continue
    groups.push({ title: region.name, storylines: list })
  }
  const elsewhere = grouped.get('')
  if (elsewhere !== undefined && elsewhere.length > 0) {
    groups.push({ title: 'Elsewhere', storylines: elsewhere })
  }
  return groups
}

function StorylineNext({
  progress,
  selectEntity,
  continueButton,
}: {
  progress: StorylineProgress
  selectEntity: (id: string) => void
  continueButton?: boolean
}) {
  if (progress.nextQuestId) {
    const nextId = progress.nextQuestId
    return (
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <span className="text-sm text-neutral-500">Next</span>
        <EntityLink id={nextId} />
        {continueButton ? (
          <PanelButton onClick={() => selectEntity(nextId)}>Continue</PanelButton>
        ) : null}
      </div>
    )
  }
  if (continueButton && progress.total > 0) {
    return <p className="mt-1.5 text-sm text-neutral-400">All done</p>
  }
  return null
}

export default function QuestLog() {
  const content = useAppStore((s) => s.content)
  const quests = useAppStore((s) => s.progress.quests)
  const selectEntity = useAppStore((s) => s.selectEntity)
  const doneSet = useMemo(() => new Set(quests), [quests])
  const storylines = useMemo(() => asStorylines(content), [content])
  const byProgress = useMemo(
    () => storylines.map((record) => ({ record, progress: storylineProgress(record, doneSet) })),
    [storylines, doneSet],
  )
  const main = byProgress.filter((item) => item.record.kind === 'main')
  const factions = useMemo(
    () => factionGroups(content, storylines),
    [content, storylines],
  )
  const factionProgress = useMemo(() => {
    const map = new Map<string, StorylineProgress>()
    for (const item of byProgress) map.set(item.record.id, item.progress)
    return map
  }, [byProgress])
  const others = useMemo(() => {
    const listed = questsInStorylines(content)
    return asQuests(content).filter((record) => !listed.has(record.id))
  }, [content])

  if (storylines.length === 0 && asQuests(content).length === 0) {
    return <p className="mt-3 px-1 text-sm text-neutral-400">No quests in data/content yet.</p>
  }

  const otherDone = others.reduce((n, record) => n + (doneSet.has(record.id) ? 1 : 0), 0)
  const otherShown = others.slice(0, OTHER_QUEST_CAP)
  const otherMore = others.length - otherShown.length

  return (
    <div className="mt-3">
      {main.length > 0 ? (
        <Section title="Main story">
          <div className="space-y-3">
            {main.map(({ record, progress }) => (
              <div key={record.id}>
                <EntityLink id={record.id} />
                <p className="mt-1 text-sm tabular-nums text-neutral-100">
                  {progress.done} of {progress.total} quests
                </p>
                <div className="mt-1">
                  <ProgressBar done={progress.done} total={progress.total} />
                </div>
                <StorylineNext
                  progress={progress}
                  selectEntity={selectEntity}
                  continueButton
                />
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {factions.length > 0 ? (
        <Section title="Faction storylines">
          <div className="space-y-3">
            {factions.map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-medium text-neutral-100">{group.title}</h4>
                <ul>
                  {group.storylines.map((record) => {
                    const progress = factionProgress.get(record.id)
                    if (progress === undefined) return null
                    return (
                      <li key={record.id} className="mt-1">
                        <div className="flex flex-wrap items-center gap-x-2">
                          <EntityLink id={record.id} />
                          <span className="text-xs tabular-nums text-neutral-400">
                            {progress.done}/{progress.total}
                          </span>
                        </div>
                        <StorylineNext progress={progress} selectEntity={selectEntity} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {others.length > 0 ? (
        <Section title="Other quests">
          <p className="text-sm tabular-nums text-neutral-100">
            {otherDone} of {others.length} done
          </p>
          <ul>
            {otherShown.map((record) => (
              <li key={record.id}>
                <span className={doneSet.has(record.id) ? 'line-through text-neutral-500' : undefined}>
                  <EntityLink id={record.id} />
                </span>
              </li>
            ))}
          </ul>
          {otherMore > 0 ? (
            <p className="mt-1 text-xs text-neutral-500">… and {otherMore} more</p>
          ) : null}
        </Section>
      ) : null}
    </div>
  )
}
