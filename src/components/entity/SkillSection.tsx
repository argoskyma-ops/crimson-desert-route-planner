import { SKILL_OWNER_CHARACTER } from '../../content/schema'
import type { EntityOf } from '../../content/types'
import AcquisitionList from './AcquisitionList'
import EntityLink from './EntityLink'
import PrerequisiteList from './PrerequisiteList'
import { Field } from './Section'

export default function SkillSection({ record }: { record: EntityOf<'skill'> }) {
  const ownerId = SKILL_OWNER_CHARACTER[record.character]
  return (
    <>
      <Field label="Owner">{ownerId ? <EntityLink id={ownerId} /> : 'Shared'}</Field>
      <Field label="Tree">{record.tree.replace(/-/g, ' ')}</Field>
      <Field label="Max level">{record.maxLevel}</Field>
      <PrerequisiteList prerequisites={record.prerequisites} />
      <AcquisitionList entityId={record.id} acquisitions={record.howToLearn} title="How to learn" />
    </>
  )
}
