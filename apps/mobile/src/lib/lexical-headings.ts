export interface LexicalHeading {
  blockId: string
  level: number
  text: string
}

interface LexicalNode {
  $?: { blockId?: string }
  children?: LexicalNode[]
  tag?: string
  text?: string
  type?: string
}

function flattenText(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  if (!Array.isArray(node.children)) return ''
  return node.children.map(flattenText).join('')
}

export function extractHeadings(content: string): LexicalHeading[] {
  let children: LexicalNode[]
  try {
    const parsed = JSON.parse(content) as { root?: { children?: LexicalNode[] } }
    children = Array.isArray(parsed.root?.children) ? parsed.root.children : []
  } catch {
    return []
  }
  return children.flatMap((node) => {
    if (node.type !== 'heading') return []
    const blockId = node.$?.blockId
    const level = Number(/^h([1-6])$/.exec(node.tag ?? '')?.[1])
    const text = flattenText(node).trim()
    if (!blockId || !text || !level) return []
    return [{ blockId, level, text }]
  })
}
