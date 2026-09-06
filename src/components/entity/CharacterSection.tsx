import { SKILL_OWNER_CHARACTER } from '../../content/schema'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import EntityLink, { LinkList } from './EntityLink'
import { Badge, Field, Section } from './Section'

export default function CharacterSection({ record }: { record: EntityOf<'character'> }) {
  const skills = useAppStore((s) => s.content.byType.skill).filter(
    (entity): entity is EntityOf<'skill'> =>
      entity.type === 'skill' && SKILL_OWNER_CHARACTER[entity.character] === record.id,
  )
  return (
    <>
      <Field label="Role">{record.role}</Field>
      {record.playable || record.companion ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {record.playable ? <Badge>Playable</Badge> : null}
          {record.companion ? <Badge>Companion</Badge> : null}
        </div>
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
      {skills.length > 0 ? (
        <Section title="Skills">
          <LinkList ids={skills.map((skill) => skill.id)} />
        </Section>
      ) : null}
    </>
  )
}
