import type { EntityOf } from '../../content/types'
import EntityLink, { LinkList } from './EntityLink'
import { Badge, Field, Section } from './Section'

export default function FactionSection({ record }: { record: EntityOf<'faction'> }) {
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      {record.hostile ? (
        <div className="mt-1.5">
          <Badge warning>Hostile</Badge>
        </div>
      ) : null}
      <Field label="Leader">{record.leader ? <EntityLink id={record.leader} /> : null}</Field>
      {record.members?.length ? (
        <Section title="Members">
          <LinkList ids={record.members} />
        </Section>
      ) : null}
      <Field label="Headquarters">
        {record.headquarters ? <EntityLink id={record.headquarters} /> : null}
      </Field>
      <Section title="Reputation">
        {record.reputation ? (
          <div className="space-y-1 text-sm">
            {record.reputation.tiers?.length ? (
              <ul className="list-disc space-y-0.5 pl-5 text-neutral-200">
                {record.reputation.tiers.map((tier) => (
                  <li key={tier}>{tier}</li>
                ))}
              </ul>
            ) : null}
            <p className="text-neutral-300">{record.reputation.notes}</p>
          </div>
        ) : null}
      </Section>
      {record.quests?.length ? (
        <Section title="Quests">
          <LinkList ids={record.quests} />
        </Section>
      ) : null}
    </>
  )
}
