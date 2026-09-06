import type { EntityOf } from '../../content/types'
import { LinkList } from './EntityLink'
import AcquisitionList from './AcquisitionList'
import { Field, Section, StatGrid } from './Section'

export default function ItemSection({ record }: { record: EntityOf<'item'> }) {
  return (
    <>
      <Field label="Category">{record.category.replace(/-/g, ' ')}</Field>
      <Field label="Slot">{record.slot}</Field>
      <Field label="Rarity">{record.rarity}</Field>
      <Field label="Set">{record.setName}</Field>
      {record.stats ? (
        <Section title="Stats">
          <StatGrid stats={record.stats} />
        </Section>
      ) : null}
      <AcquisitionList entityId={record.id} acquisitions={record.acquisitions} />
      {record.usedIn?.length ? (
        <Section title="Used in">
          <LinkList ids={record.usedIn} />
        </Section>
      ) : null}
    </>
  )
}
