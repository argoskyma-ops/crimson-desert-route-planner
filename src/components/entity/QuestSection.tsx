import { stepKey } from '../../content/progress'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import GuideSteps from '../GuideSteps'
import EntityLink, { LinkList } from './EntityLink'
import PrerequisiteList from './PrerequisiteList'
import RewardList from './RewardList'
import { Badge, Field, Section } from './Section'

export default function QuestSection({ record }: { record: EntityOf<'quest'> }) {
  const done = useAppStore((s) => s.progress.quests.includes(record.id))
  const toggleQuestDone = useAppStore((s) => s.toggleQuestDone)
  const missable = record.missable === 'easy-to-miss' || record.missable === 'lost-if'
  return (
    <>
      <label className="mt-1.5 flex min-h-11 items-center gap-2 text-sm text-neutral-100">
        <input type="checkbox" checked={done} onChange={() => toggleQuestDone(record.id)} />
        Done
      </label>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Field label="Chapter">{record.chapter}</Field>
      <Field label="Storyline">
        {record.storyline ? <EntityLink id={record.storyline} /> : null}
      </Field>
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
      <PrerequisiteList prerequisites={record.prerequisites} />
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
