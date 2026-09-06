import type { SearchIndex } from '../../content/search'
import type { FieldSpec } from '../../lib/content-io'
import { IdListEditor, IdPicker, StringListEditor } from './IdPicker'
import { JsonField } from './JsonField'
import { LocationField } from './LocationField'
import { BooleanField, EnumField, NumberField, TextField } from './SimpleFields'
import { SourcesEditor } from './SourcesEditor'
import { StepListEditor } from './StepListEditor'

export function FieldControl({
  spec,
  path,
  value,
  index,
  jsonError,
  onChange,
  onJsonError,
}: {
  spec: FieldSpec
  path: string
  value: unknown
  index: SearchIndex
  jsonError: string | null
  onChange: (value: unknown) => void
  onJsonError: (message: string | null) => void
}) {
  switch (spec.kind) {
    case 'text':
      return (
        <TextField
          label={spec.key}
          value={value}
          multiline={spec.multiline}
          onChange={onChange}
        />
      )
    case 'number':
      return <NumberField label={spec.key} value={value} onChange={onChange} />
    case 'boolean':
      return <BooleanField label={spec.key} value={value} onChange={onChange} />
    case 'enum':
      return <EnumField spec={spec} value={value} onChange={onChange} />
    case 'id':
      return (
        <IdPicker
          label={spec.key}
          value={typeof value === 'string' ? value : ''}
          entityType={spec.entityType ?? 'any'}
          index={index}
          onChange={onChange}
        />
      )
    case 'id-list':
      return (
        <IdListEditor
          label={spec.key}
          value={value}
          entityType={spec.entityType ?? 'any'}
          index={index}
          onChange={onChange}
        />
      )
    case 'string-list':
      return <StringListEditor label={spec.key} value={value} onChange={onChange} />
    case 'location':
      return <LocationField label={spec.key} path={path} value={value} onChange={onChange} />
    case 'steps':
      return <StepListEditor path={path} value={value} index={index} onChange={onChange} />
    case 'sources':
      return <SourcesEditor value={value} onChange={onChange} />
    case 'json':
      return (
        <JsonField
          label={spec.key}
          value={value}
          error={jsonError}
          onChange={onChange}
          onError={onJsonError}
        />
      )
  }
}
