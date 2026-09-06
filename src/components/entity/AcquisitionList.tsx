import { acquisitionStepKey } from '../../content/progress'
import type { Acquisition } from '../../content/types'
import GuideSteps from '../GuideSteps'
import EntityLink from './EntityLink'
import { Section } from './Section'
import ShowOnMapButton from './ShowOnMap'

export default function AcquisitionList({
  entityId,
  acquisitions,
  title = 'Acquisitions',
}: {
  entityId: string
  acquisitions?: Acquisition[]
  title?: string
}) {
  if (acquisitions === undefined || acquisitions.length === 0) return null
  return (
    <Section title={title}>
      <ul className="space-y-2">
        {acquisitions.map((acq, index) => (
          <li
            key={index}
            className="rounded-lg border border-white/10 bg-neutral-900/60 p-2 text-sm"
          >
            <p className="capitalize">{acq.kind.replace(/-/g, ' ')}</p>
            {acq.ref ? <EntityLink id={acq.ref} /> : null}
            {acq.cost ? (
              <p className="text-neutral-400">
                {acq.cost.amount} {acq.cost.currency}
              </p>
            ) : null}
            {acq.chance !== undefined ? (
              <p className="text-neutral-400">{Math.round(acq.chance * 100)}%</p>
            ) : null}
            {acq.note ? <p className="text-neutral-400">{acq.note}</p> : null}
            {acq.location ? <ShowOnMapButton location={acq.location} /> : null}
            {acq.steps?.length ? (
              <Section title="Steps">
                <GuideSteps
                  entityId={entityId}
                  steps={acq.steps}
                  keyFor={(j) => acquisitionStepKey(entityId, index, j)}
                />
              </Section>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  )
}
