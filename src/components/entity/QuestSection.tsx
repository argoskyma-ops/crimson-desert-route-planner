import type { EntityOf } from '../../content/types'
import EntityLink, { LinkList } from './EntityLink'
import PrerequisiteList from './PrerequisiteList'
import RewardList from './RewardList'
import { Badge, Field, Section } from './Section'
import StepList from './StepList'

export default function QuestSection({ record }: { record: EntityOf<'quest'> }) {
  const missable = record.missable === 'easy-to-miss' || record.missable === 'lost-if'
  return (
    <>
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
      <StepList steps={record.steps} />
      <RewardList rewards={record.rewards} />
      {record.unlocks?.length ? (
        <Section title="Unlocks">
          <LinkList ids={record.unlocks} />
        </Section>
      ) : null}
    </>
  )
}
