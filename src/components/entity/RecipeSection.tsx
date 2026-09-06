import type { EntityOf } from '../../content/types'
import AcquisitionList from './AcquisitionList'
import EntityLink from './EntityLink'
import { Field, Section } from './Section'

export default function RecipeSection({ record }: { record: EntityOf<'recipe'> }) {
  return (
    <>
      <Field label="Station">{record.station.replace(/-/g, ' ')}</Field>
      <Section title="Inputs">
        <ul className="space-y-0.5 text-sm">
          {record.inputs.map((input) => (
            <li key={input.item} className="flex flex-wrap items-center gap-1">
              <EntityLink id={input.item} />
              <span className="tabular-nums text-neutral-400">× {input.qty}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Field label="Output">
        <span className="inline-flex flex-wrap items-center gap-1">
          <EntityLink id={record.output.item} />
          <span className="tabular-nums text-neutral-400">× {record.output.qty}</span>
        </span>
      </Field>
      <AcquisitionList
        entityId={record.id}
        acquisitions={record.learnedFrom ? [record.learnedFrom] : undefined}
        title="Learned from"
      />
    </>
  )
}
