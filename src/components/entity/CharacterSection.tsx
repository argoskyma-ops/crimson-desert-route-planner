import type { EntityOf } from '../../content/types'
import EntityLink, { LinkList } from './EntityLink'
import { Badge, Field, Section } from './Section'

export default function CharacterSection({ record }: { record: EntityOf<'character'> }) {
  return (
    <>
      <Field label="Role">{record.role}</Field>
      {record.playable || record.companion ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {record.playable ? <Badge>Playable</Badge> : null}
          {record.companion ? <Badge>Companion</Badge> : null}
        </div>
      ) : null}
      {record.factions?.length ? (
        <Section title="Factions">
          <LinkList ids={record.factions} />
        </Section>
      ) : null}
      <Field label="Vendor">{record.vendor ? <EntityLink id={record.vendor} /> : null}</Field>
      <Field label="Home">{record.home ? <EntityLink id={record.home} /> : null}</Field>
      <Section title="Facts">
        {record.facts?.length ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-200">
            {record.facts.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
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
