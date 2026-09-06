import { related } from '../../content/db'
import type { EntityOf } from '../../content/types'
import { useAppStore } from '../../store'
import AcquisitionList from './AcquisitionList'
import EntityLink from './EntityLink'
import { Field, Section } from './Section'

export default function RecipeSection({ record }: { record: EntityOf<'recipe'> }) {
  const db = useAppStore((s) => s.content)
  return (
    <>
      <Field label="Station">{record.station.replace(/-/g, ' ')}</Field>
      <Section title="Inputs">
        <ul className="space-y-0.5 text-sm">
          {record.inputs.map((input, index) => {
            const soldBy = related(db, 'soldBy', input.item)
            const droppedBy = related(db, 'droppedBy', input.item)
            return (
              <li key={`${input.item}-${index}`}>
                <div className="flex flex-wrap items-center gap-1">
                  <EntityLink id={input.item} />
                  <span className="tabular-nums text-neutral-400">× {input.qty}</span>
                </div>
                {soldBy.length > 0 || droppedBy.length > 0 ? (
                  <div className="text-xs text-neutral-500">
                    {soldBy.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-1">
                        <span>Sold by</span>
                        {soldBy.map((id) => (
                          <EntityLink key={id} id={id} />
                        ))}
                      </div>
                    ) : null}
                    {droppedBy.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-1">
                        <span>Dropped by</span>
                        {droppedBy.map((id) => (
                          <EntityLink key={id} id={id} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
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
