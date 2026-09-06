import { stepKey } from '../../content/progress'
import type { EntityOf } from '../../content/types'
import GuideSteps from '../GuideSteps'
import EntityLink from './EntityLink'
import Markdown from './Markdown'
import PrerequisiteList from './PrerequisiteList'
import { Badge, Field, Section } from './Section'

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
      <Section title="Steps">
        <GuideSteps
          entityId={record.id}
          steps={record.steps}
          keyFor={(j) => stepKey(record.id, j)}
        />
      </Section>
      {record.notes ? (
        <Section title="Notes">
          <Markdown source={record.notes} />
        </Section>
      ) : null}
    </>
  )
}
