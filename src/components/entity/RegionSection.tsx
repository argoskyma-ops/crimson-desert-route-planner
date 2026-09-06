import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import EntityLink, { LinkList } from './EntityLink'
import { Field, Section } from './Section'

export default function RegionSection({ record }: { record: EntityOf<'region'> }) {
  const regions = useAppStore((s) => s.content.byType.region)
  const subAreas = regions.filter(
    (entity): entity is EntityOf<'region'> =>
      entity.type === 'region' && entity.parent === record.id,
  )
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Field label="Parent">{record.parent ? <EntityLink id={record.parent} /> : null}</Field>
      <Field label="Level range">
        {record.levelRange ? `Level ${record.levelRange[0]} to ${record.levelRange[1]}` : null}
      </Field>
      {record.keyPlaces?.length ? (
        <Section title="Key places">
          <LinkList ids={record.keyPlaces} />
        </Section>
      ) : null}
      {subAreas.length > 0 ? (
        <Section title="Sub-areas">
          <LinkList ids={subAreas.map((area) => area.id)} />
        </Section>
      ) : null}
    </>
  )
}
