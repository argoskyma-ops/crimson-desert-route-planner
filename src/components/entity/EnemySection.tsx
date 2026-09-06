import type { EntityOf } from '../../content/types'
import EntityLink from './EntityLink'
import Markdown from './Markdown'
import { Field, Section } from './Section'

export default function EnemySection({ record }: { record: EntityOf<'enemy'> }) {
  return (
    <>
      <Field label="Rank">{record.rank.replace(/-/g, ' ')}</Field>
      <Field label="Level">{record.level}</Field>
      <Section title="Weaknesses">
        {record.weaknesses?.length ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-neutral-200">
            {record.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </Section>
      <Section title="Drops">
        {record.drops.length === 0 ? null : (
          <ul className="space-y-1">
            {record.drops.map((drop) => (
              <li key={drop.item} className="flex flex-wrap items-center gap-2 text-sm">
                <EntityLink id={drop.item} />
                {drop.chance !== undefined ? (
                  <span className="text-neutral-400">{Math.round(drop.chance * 100)}%</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
      {record.strategy ? (
        <Section title="Strategy">
          <Markdown source={record.strategy} />
        </Section>
      ) : null}
    </>
  )
}
