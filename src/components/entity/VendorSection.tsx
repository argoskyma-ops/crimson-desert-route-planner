import type { EntityOf } from '../../content/types'
import EntityLink from './EntityLink'
import { Field, Section } from './Section'

export default function VendorSection({ record }: { record: EntityOf<'vendor'> }) {
  return (
    <>
      <Field label="Shop type">{record.shopType.replace(/[_-]/g, ' ')}</Field>
      <Field label="Character">
        {record.character ? <EntityLink id={record.character} /> : null}
      </Field>
      <Field label="Place">{record.place ? <EntityLink id={record.place} /> : null}</Field>
      <Field label="Currencies">
        {record.currencies?.length ? record.currencies.join(', ') : null}
      </Field>
      <Section title="Inventory">
        {record.inventory.length === 0 ? null : (
          <ul className="space-y-2">
            {record.inventory.map((line) => (
              <li
                key={line.item}
                className="rounded-lg border border-white/10 bg-neutral-900/60 p-2 text-sm"
              >
                <EntityLink id={line.item} />
                {line.price ? (
                  <p className="text-neutral-400">
                    {line.price.amount} {line.price.currency}
                  </p>
                ) : null}
                {line.unlimited ? (
                  <p className="text-neutral-400">Unlimited</p>
                ) : line.stock !== undefined ? (
                  <p className="text-neutral-400">{line.stock}</p>
                ) : null}
                {line.unlock ? <p className="text-neutral-400">{line.unlock}</p> : null}
                {line.trust !== undefined ? (
                  <p className="text-neutral-400">Trust {line.trust}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  )
}
