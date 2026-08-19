const PREVIEW_MIN_NODES = 4
const PREVIEW_MAX_NODES = 8
const PREVIEW_MIN_TEXT_LENGTH = 220

const BOLD = 1
const ITALIC = 2
const STRIKE = 4
const UNDERLINE = 8
const CODE = 16

export type PreviewInline = {
  break?: true
  bold?: true
  code?: true
  href?: string
  italic?: true
  strike?: true
  text?: string
  underline?: true
}

export type PreviewBlock =
  | { inlines: PreviewInline[]; type: 'paragraph' }
  | { inlines: PreviewInline[]; level: number; type: 'heading' }
  | { inlines: PreviewInline[]; type: 'quote' }
  | { items: PreviewInline[][]; ordered: boolean; type: 'list' }
  | { alt: string; src: string; type: 'image' }

export type NotePreviewResult = {
  blocks: PreviewBlock[]
  truncated: boolean
}

type LexNode = {
  altText?: unknown
  children?: LexNode[]
  format?: unknown
  listType?: unknown
  src?: unknown
  tag?: unknown
  text?: unknown
  type?: unknown
  url?: unknown
}

function asNode(value: unknown): LexNode | null {
  return value && typeof value === 'object' ? (value as LexNode) : null
}

function headingLevel(tag: unknown): number {
  if (typeof tag !== 'string') return 2
  const match = /^h([1-6])$/.exec(tag)
  return match ? Number(match[1]) : 2
}

function inlineFlags(
  format: unknown,
): Pick<PreviewInline, 'bold' | 'code' | 'italic' | 'strike' | 'underline'> {
  const bits = typeof format === 'number' ? format : 0
  return {
    ...(bits & BOLD ? { bold: true as const } : null),
    ...(bits & ITALIC ? { italic: true as const } : null),
    ...(bits & STRIKE ? { strike: true as const } : null),
    ...(bits & UNDERLINE ? { underline: true as const } : null),
    ...(bits & CODE ? { code: true as const } : null),
  }
}

function walkInlines(nodes: LexNode[] | undefined): PreviewInline[] {
  const out: PreviewInline[] = []
  for (const node of nodes ?? []) {
    if (node.type === 'linebreak') {
      out.push({ break: true })
      continue
    }
    if (node.type === 'tab') {
      out.push({ text: ' ' })
      continue
    }
    if (node.type === 'text' && typeof node.text === 'string') {
      if (node.text.length === 0) continue
      out.push({ text: node.text, ...inlineFlags(node.format) })
      continue
    }
    if (
      (node.type === 'link' || node.type === 'autolink') &&
      typeof node.url === 'string'
    ) {
      const children = walkInlines(node.children)
      const text = children.map((child) => child.text ?? '').join('')
      if (text) out.push({ href: node.url, text })
      continue
    }
    if (Array.isArray(node.children)) {
      out.push(...walkInlines(node.children))
    }
  }
  return out
}

function inlineTextLength(inlines: PreviewInline[]): number {
  return inlines
    .map((inline) => inline.text ?? '')
    .join('')
    .replaceAll(/\s+/g, '').length
}

function blockTextLength(block: PreviewBlock): number {
  if (block.type === 'image') return 0
  if (block.type === 'list') {
    return block.items.reduce((sum, item) => sum + inlineTextLength(item), 0)
  }
  return inlineTextLength(block.inlines)
}

function walkBlock(node: LexNode): PreviewBlock | null {
  if (node.type === 'paragraph') {
    const inlines = walkInlines(node.children)
    return inlines.length > 0 ? { inlines, type: 'paragraph' } : null
  }
  if (node.type === 'heading') {
    const inlines = walkInlines(node.children)
    return inlines.length > 0
      ? { inlines, level: headingLevel(node.tag), type: 'heading' }
      : null
  }
  if (node.type === 'quote') {
    const inlines = walkInlines(node.children)
    return inlines.length > 0 ? { inlines, type: 'quote' } : null
  }
  if (node.type === 'list') {
    const items = (node.children ?? [])
      .filter((child) => child.type === 'listitem')
      .map((child) => walkInlines(child.children))
      .filter((item) => item.length > 0)
    if (items.length === 0) return null
    return { items, ordered: node.listType === 'number', type: 'list' }
  }
  if (node.type === 'image' && typeof node.src === 'string' && node.src) {
    return {
      alt: typeof node.altText === 'string' ? node.altText : '',
      src: node.src,
      type: 'image',
    }
  }
  return null
}

function takePreview(blocks: PreviewBlock[]): NotePreviewResult {
  if (blocks.length <= PREVIEW_MIN_NODES) {
    return { blocks, truncated: false }
  }
  let count = PREVIEW_MIN_NODES
  let textLength = 0
  for (let i = 0; i < count; i += 1) textLength += blockTextLength(blocks[i])
  while (
    count < blocks.length &&
    count < PREVIEW_MAX_NODES &&
    textLength < PREVIEW_MIN_TEXT_LENGTH
  ) {
    textLength += blockTextLength(blocks[count])
    count += 1
  }
  return {
    blocks: blocks.slice(0, count),
    truncated: count < blocks.length,
  }
}

export function parseNotePreview(content: string): NotePreviewResult {
  let parsed: { root?: { children?: unknown[] } }
  try {
    parsed = JSON.parse(content) as { root?: { children?: unknown[] } }
  } catch {
    return { blocks: [], truncated: false }
  }
  const children = parsed.root?.children
  if (!Array.isArray(children)) return { blocks: [], truncated: false }
  const blocks = children
    .map(asNode)
    .filter((node): node is LexNode => node !== null)
    .map(walkBlock)
    .filter((block): block is PreviewBlock => block !== null)
  return takePreview(blocks)
}
