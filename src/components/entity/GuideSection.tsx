import type { EntityOf } from '../../content/types'
import EntityLink from './EntityLink'
import Markdown from './Markdown'
import PrerequisiteList from './PrerequisiteList'
import { Badge, Field, Section } from './Section'
import StepList from './StepList'

export default function GuideSection({ record }: { record: EntityOf<'guide'> }) {
  return (
    <>
      <Field label="Target">
        <EntityLink id={record.target} />
      </Field>
      {record.repeatable ? (
        <div className="mt-1.5">
          <Badge>Repeatable</Badge>
        </div>
      ) : null}
      <PrerequisiteList prerequisites={record.prerequisites} />
      <StepList steps={record.steps} />
      {record.notes ? (
        <Section title="Notes">
          <Markdown source={record.notes} />
        </Section>
      ) : null}
    </>
  )
}
