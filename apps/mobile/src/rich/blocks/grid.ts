import type { SerializedEditorState } from 'lexical'

interface JsonNode {
  children?: JsonNode[]
  text?: unknown
  type?: unknown
}

const MEDIA_TYPES = new Set(['gallery', 'image', 'video'])

function isBlank(node: JsonNode): boolean {
  if (node.type === 'text')
    return typeof node.text !== 'string' || !node.text.trim()
  return node.type === 'linebreak'
}

function mediaOnly(nodes: JsonNode[]): { blank: boolean; media: boolean } {
  let media = false
  for (const node of nodes) {
    if (MEDIA_TYPES.has(String(node.type))) {
      media = true
      continue
    }
    if (node.type === 'paragraph') {
      const inner = mediaOnly(node.children ?? [])
      if (!inner.blank) return { blank: false, media: false }
      media ||= inner.media
      continue
    }
    if (!isBlank(node)) return { blank: false, media: false }
  }
  return { blank: true, media }
}

export function isMediaGrid(cells: SerializedEditorState[]): boolean {
  if (cells.length === 0) return false
  return cells.every((cell) => {
    const result = mediaOnly(
      ((cell.root as unknown as JsonNode | undefined)?.children ??
        []) as JsonNode[],
    )
    return result.blank && result.media
  })
}

export function gridCells(
  node: Record<string, unknown>,
): SerializedEditorState[] {
  if (Array.isArray(node.cells)) return node.cells as SerializedEditorState[]
  if (Array.isArray(node.children))
    return node.children.map(
      (child) => ({ root: { type: 'root', children: [child] } }) as never,
    )
  return []
}
