import { ENTITY_TYPES, isEntityType, type EntityType } from '../../content/ids'
import { ENTITY_LABELS } from '../../content/types'
import { suggestId } from '../../lib/content-io'
import { FieldLabel } from './SimpleFields'
import { inputClass } from './ui'

export function RecordHeader({
  type,
  selectedId,
  records,
  draft,
  idTouched,
  onType,
  onSelect,
  onName,
  onId,
}: {
  type: EntityType
  selectedId: string
  records: readonly { id: string; name: string }[]
  draft: Record<string, unknown>
  idTouched: boolean
  onType: (type: EntityType) => void
  onSelect: (id: string) => void
  onName: (draft: Record<string, unknown>) => void
  onId: (id: string) => void
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <FieldLabel label="type" />
          <select
            value={type}
            onChange={(event) => {
              if (!isEntityType(event.target.value)) return
              onType(event.target.value)
            }}
            className={inputClass}
          >
            {ENTITY_TYPES.map((item) => (
              <option key={item} value={item}>
                {ENTITY_LABELS[item]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel label="record" />
          <select
            value={selectedId}
            onChange={(event) => onSelect(event.target.value)}
            className={inputClass}
          >
            <option value="new">New record</option>
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {record.name} ({record.id})
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectedId === 'new' ? (
        <div className="space-y-1">
          <div>
            <FieldLabel label="name" />
            <input
              type="text"
              value={typeof draft.name === 'string' ? draft.name : ''}
              required
              onChange={(event) => {
                const name = event.target.value
                onName({ ...draft, name, id: idTouched ? draft.id : suggestId(type, name) })
              }}
              className={inputClass}
            />
          </div>
          <div>
            <FieldLabel label="id" />
            <input
              type="text"
              value={typeof draft.id === 'string' ? draft.id : ''}
              required
              onChange={(event) => onId(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
