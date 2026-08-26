const TEXTISH = new Set([
  'comment',
  'footnote',
  'katex-inline',
  'linebreak',
  'mention',
  'tab',
  'tag',
  'text',
])

type Node = {
  cells?: unknown[]
  children?: Node[]
  content?: { root?: Node }
  direction?: unknown
  format?: unknown
  indent?: unknown
  root?: Node
  type?: string
  [key: string]: unknown
}

function walk(node: Node): Node {
  if (typeof node.type === 'string' && !TEXTISH.has(node.type)) {
    node.indent = typeof node.indent === 'number' ? node.indent : 0
    if (!('direction' in node)) node.direction = null
    if (!('format' in node)) node.format = ''
  }
  if (Array.isArray(node.children)) {
    node.children = node.children.map((child) => walk(child))
  }
  if (node.content?.root) {
    node.content = { ...node.content, root: walk(node.content.root) }
  }
  if (Array.isArray(node.cells)) {
    node.cells = node.cells.map((cell) =>
      cell && typeof cell === 'object' ? walk(cell as Node) : cell,
    )
  }
  if (node.root) {
    node.root = walk(node.root)
  }
  return node
}

/** Fill ElementNode fields Lexical's importJSON requires (indent/direction/format). */
export function withLexicalElementDefaults<T>(state: T): T {
  return walk(structuredClone(state) as Node) as T
}
