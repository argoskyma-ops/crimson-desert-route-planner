import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import { LinkList, UnknownId } from './EntityLink'
import { Field, Section } from './Section'

export default function PlaceSection({ record }: { record: EntityOf<'place'> }) {
  const locations = useAppStore((s) => s.fastTravel)
  const fastTravel = record.fastTravel
    ? locations.find((loc) => loc.id === record.fastTravel)
    : undefined
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Field label="Fast travel">
        {record.fastTravel === undefined
          ? null
          : fastTravel !== undefined
            ? fastTravel.name
            : <UnknownId id={record.fastTravel} />}
      </Field>
      {record.contains?.length ? (
        <Section title="Contains">
          <LinkList ids={record.contains} />
        </Section>
      ) : null}
    </>
  )
}
