import type { Step } from '../../content/types'
import EntityLink from './EntityLink'
import { Badge, Section } from './Section'
import ShowOnMapButton from './ShowOnMap'

function MissableBadge({ step }: { step: Step }) {
  if (step.missable === 'easy-to-miss') {
    return <Badge warning>Easy to miss</Badge>
  }
  if (step.missable === 'lost-if') {
    return (
      <span className="inline-flex flex-wrap items-center gap-1">
        <Badge warning>Lost if …</Badge>
        {step.missableNote ? (
          <span className="text-xs text-amber-300">{step.missableNote}</span>
        ) : null}
      </span>
    )
  }
  return null
}

export default function StepList({
  steps,
  title = 'Steps',
}: {
  steps?: Step[]
  title?: string
}) {
  if (steps === undefined || steps.length === 0) return null
  return (
    <Section title={title}>
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={index} className="flex gap-2 text-sm">
            <span className="w-5 shrink-0 tabular-nums text-neutral-500">{index + 1}.</span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-neutral-100">{step.text}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {step.action ? <Badge>{step.action}</Badge> : null}
                {step.cost ? (
                  <span className="text-xs text-neutral-400">
                    {step.cost.amount} {step.cost.currency}
                  </span>
                ) : null}
                <MissableBadge step={step} />
                {step.optional ? <Badge>optional</Badge> : null}
              </div>
              {step.refs?.length ? (
                <ul className="space-y-0.5">
                  {step.refs.map((id) => (
                    <li key={id}>
                      <EntityLink id={id} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.location ? <ShowOnMapButton location={step.location} /> : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}
