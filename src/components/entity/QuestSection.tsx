import { useMemo } from 'react'
import { stepKey } from '../../content/progress'
import { prerequisiteState, storylineProgress } from '../../content/storyline'
import type { EntityOf, Storyline } from '../../content/types'
import { useAppStore } from '../../store'
import GuideSteps from '../GuideSteps'
import EntityLink, { LinkList } from './EntityLink'
import PrerequisiteList from './PrerequisiteList'
import RewardList from './RewardList'
import { Badge, Field, Section } from './Section'

function chapterPosition(storyline: Storyline, questId: string) {
  for (const chapter of storyline.chapters) {
    const index = chapter.quests.indexOf(questId)
    if (index !== -1) {
      return { title: chapter.title, index: index + 1, total: chapter.quests.length }
    }
  }
  return null
}

export default function QuestSection({ record }: { record: EntityOf<'quest'> }) {
  const content = useAppStore((s) => s.content)
  const quests = useAppStore((s) => s.progress.quests)
  const toggleQuestDone = useAppStore((s) => s.toggleQuestDone)
  const done = quests.includes(record.id)
  const doneQuests = useMemo(() => new Set(quests), [quests])
  const storyline = useMemo(() => {
    if (record.storyline === undefined) return undefined
    const found = content.byId.get(record.storyline)
    return found?.type === 'storyline' ? found : undefined
  }, [content, record.storyline])
  const slProgress = useMemo(
    () => (storyline ? storylineProgress(storyline, doneQuests) : null),
    [storyline, doneQuests],
  )
  const position = useMemo(
    () => (storyline ? chapterPosition(storyline, record.id) : null),
    [storyline, record.id],
  )
  const states = useMemo(
    () =>
      record.prerequisites.map((item) =>
        prerequisiteState(item, { db: content, doneQuests, quest: record }),
      ),
    [record, content, doneQuests],
  )
  const isNext = slProgress?.nextQuestId === record.id
  const nextInStoryline =
    slProgress?.nextQuestId && slProgress.nextQuestId !== record.id
      ? slProgress.nextQuestId
      : null
  const missable = record.missable === 'easy-to-miss' || record.missable === 'lost-if'

  return (
    <>
      <label className="mt-1.5 flex min-h-11 items-center gap-2 text-sm text-neutral-100">
        <input type="checkbox" checked={done} onChange={() => toggleQuestDone(record.id)} />
        Done
        {isNext ? <Badge>Next up</Badge> : null}
      </label>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Field label="Chapter">{record.chapter}</Field>
      <Field label="Storyline">
        {record.storyline ? <EntityLink id={record.storyline} /> : null}
      </Field>
      {position ? (
        <p className="text-xs text-neutral-400">
          {position.title} · quest {position.index} of {position.total} in this chapter
        </p>
      ) : null}
      {nextInStoryline ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-neutral-500">Next in storyline</span>
          <EntityLink id={nextInStoryline} />
        </div>
      ) : null}
      <Field label="Giver">{record.giver ? <EntityLink id={record.giver} /> : null}</Field>
      <Field label="Faction">{record.faction ? <EntityLink id={record.faction} /> : null}</Field>
      {missable || record.repeatable ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {record.missable === 'easy-to-miss' ? <Badge warning>Missable</Badge> : null}
          {record.missable === 'lost-if' ? (
            <>
              <Badge warning>Lost if</Badge>
              {record.missableNote ? (
                <span className="text-xs text-amber-300">{record.missableNote}</span>
              ) : null}
            </>
          ) : null}
          {record.repeatable ? <Badge>Repeatable</Badge> : null}
        </div>
      ) : null}
      <PrerequisiteList prerequisites={record.prerequisites} states={states} />
      <Section title="Steps">
        <GuideSteps
          entityId={record.id}
          steps={record.steps}
          keyFor={(j) => stepKey(record.id, j)}
        />
      </Section>
      <RewardList rewards={record.rewards} />
      {record.unlocks?.length ? (
        <Section title="Unlocks">
          <LinkList ids={record.unlocks} />
        </Section>
      ) : null}
    </>
  )
}
