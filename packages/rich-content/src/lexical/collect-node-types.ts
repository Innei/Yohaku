interface TypedNode {
  children?: TypedNode[]
  content?: { root?: TypedNode }
  root?: TypedNode
  type?: string
}

export function collectLexicalNodeTypes(node: unknown): Set<string> {
  const types = new Set<string>()
  walk(node, types)
  return types
}

function walk(node: unknown, types: Set<string>) {
  if (node === null || typeof node !== 'object') return
  const typed = node as TypedNode
  if (typeof typed.type === 'string') types.add(typed.type)
  if (Array.isArray(typed.children)) {
    for (const child of typed.children) walk(child, types)
  }
  if (typed.content?.root) walk(typed.content.root, types)
  if (typed.root) walk(typed.root, types)
}
