import { parseMiniMarkdown, type Inline } from '../../lib/mini-markdown'
import EntityLink from './EntityLink'

function InlineNodes({ nodes }: { nodes: Inline[] }) {
  return nodes.map((node, index) => {
    if (node.kind === 'text') {
      return <span key={index}>{node.text}</span>
    }
    if (node.kind === 'bold') {
      return (
        <strong key={index}>
          <InlineNodes nodes={node.children} />
        </strong>
      )
    }
    return <EntityLink key={index} id={node.id} />
  })
}

export default function Markdown({ source }: { source: string }) {
  const blocks = parseMiniMarkdown(source)
  if (blocks.length === 0) return null
  return (
    <div className="space-y-2 text-sm text-neutral-200">
      {blocks.map((block, index) => {
        if (block.kind === 'paragraph') {
          return (
            <p key={index}>
              <InlineNodes nodes={block.children} />
            </p>
          )
        }
        return (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>
                <InlineNodes nodes={item} />
              </li>
            ))}
          </ul>
        )
      })}
    </div>
  )
}
