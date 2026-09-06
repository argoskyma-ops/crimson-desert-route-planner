import type { EntityOf } from '../../content/types'
import AcquisitionList from './AcquisitionList'
import { Badge, Field, Section, StatGrid } from './Section'

export default function MountSection({ record }: { record: EntityOf<'mount'> }) {
  return (
    <>
      <Field label="Species">{record.species}</Field>
      {record.legendary ? (
        <div className="mt-1.5">
          <Badge>Legendary</Badge>
        </div>
      ) : null}
      {record.stats ? (
        <Section title="Stats">
          <StatGrid stats={record.stats} />
        </Section>
      ) : null}
      <AcquisitionList entityId={record.id} acquisitions={record.howToGet} title="How to get" />
    </>
  )
}
