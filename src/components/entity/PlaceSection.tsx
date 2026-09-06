import type { EntityOf } from '../../content/types'
import { LinkList } from './EntityLink'
import { Field, Section } from './Section'

export default function PlaceSection({ record }: { record: EntityOf<'place'> }) {
  return (
    <>
      <Field label="Kind">{record.kind.replace(/-/g, ' ')}</Field>
      <Field label="Fast travel">{record.fastTravel}</Field>
      {record.contains?.length ? (
        <Section title="Contains">
          <LinkList ids={record.contains} />
        </Section>
      ) : null}
    </>
  )
}
