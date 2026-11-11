import { EXCALIDRAW_FONT_STACK } from './fonts'
import type { ExcalidrawElement, RichTextElement } from './types'

export interface RichNode {
  [key: string]: unknown
  children?: RichNode[]
  format?: number | string
  listType?: string
  style?: string
  tag?: string
  text?: string
  type: string
  url?: string
}

export const RICHTEXT_PADDING = 12
export const RICHTEXT_LIST_INDENT = 20
export const RICHTEXT_QUOTE_INDENT = 12
export const RICHTEXT_TEXT_COLOR = '#1e1e1e'
export const RICHTEXT_LINK_COLOR = '#1971c2'
export const RICHTEXT_QUOTE_BORDER = '3px solid #c4c4c4'

export interface BlockTypography {
  fontSize: number
  fontWeight: 400 | 600
  lineHeight: number
}

const BODY: BlockTypography = { fontSize: 16, fontWeight: 400, lineHeight: 1.5 }

const HEADINGS: Record<string, BlockTypography> = {
  h1: { fontSize: 26, fontWeight: 600, lineHeight: 1.3 },
  h2: { fontSize: 22, fontWeight: 600, lineHeight: 1.35 },
  h3: { fontSize: 18, fontWeight: 600, lineHeight: 1.4 },
}

export function blockTypography(node: RichNode): BlockTypography {
  if (node.type !== 'heading') return BODY
  return HEADINGS[node.tag ?? ''] ?? { ...BODY, fontWeight: 600 }
}

export const TEXT_FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  highlight: 128,
} as const

export function hasFormat(node: RichNode, flag: number): boolean {
  return typeof node.format === 'number' && (node.format & flag) !== 0
}

const BLOCK_CONTAINERS = new Set(['root', 'list', 'listitem', 'quote'])

export function richTextPlainText(node: RichNode | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (typeof node.text === 'string' && !node.children?.length) return node.text
  if (node.type === 'linebreak') return '\n'
  if (node.type === 'tab') return '\t'
  return (node.children ?? []).map(richTextPlainText).join('')
}

export function contentRoot(content: unknown): RichNode {
  const root = (content as { root?: RichNode } | undefined)?.root
  return root && Array.isArray(root.children)
    ? root
    : { type: 'root', children: [] }
}

const CJK =
  /[\p{Script=Han}\p{Script=Hangul}\p{Script=Hiragana}\p{Script=Katakana}　-〿！-｠]/u

type Context2D = {
  font: string
  measureText: (text: string) => { width: number }
}

let context: Context2D | null | undefined

function getContext(): Context2D | null {
  if (context !== undefined) return context
  context = null
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      context = new OffscreenCanvas(1, 1).getContext('2d') as Context2D | null
    }
    if (!context && typeof document !== 'undefined') {
      context = document.createElement('canvas').getContext('2d')
    }
  } catch {
    context = null
  }
  return context
}

function measureLine(text: string, font: string, size: number): number {
  const ctx = getContext()
  if (ctx) {
    ctx.font = font
    return ctx.measureText(text).width
  }
  let width = 0
  for (const ch of text) width += CJK.test(ch) ? size : size * 0.6
  return width
}

function tokenize(paragraph: string): string[] {
  const tokens: string[] = []
  let word = ''
  for (const ch of paragraph) {
    if (ch === ' ' || CJK.test(ch)) {
      if (word) tokens.push(word)
      word = ''
      tokens.push(ch)
    } else {
      word += ch
    }
  }
  if (word) tokens.push(word)
  return tokens
}

function countLines(
  paragraph: string,
  font: string,
  size: number,
  maxWidth: number,
): number {
  let lines = 0
  let line = ''
  const fits = (text: string) => measureLine(text, font, size) <= maxWidth
  for (const token of tokenize(paragraph)) {
    if (fits(line + token)) {
      line += token
      continue
    }
    if (token === ' ') {
      lines++
      line = ''
      continue
    }
    if (line) lines++
    line = ''
    for (const ch of token) {
      if (line && !fits(line + ch)) {
        lines++
        line = ch
      } else {
        line += ch
      }
    }
  }
  return lines + 1
}

function blockHeight(node: RichNode, width: number): number {
  const { fontSize, fontWeight, lineHeight } = blockTypography(node)
  const font = `${fontWeight === 600 ? 'bold ' : ''}${fontSize}px ${EXCALIDRAW_FONT_STACK.sans}`
  const maxWidth = Math.max(1, width)
  const lines = richTextPlainText(node)
    .split('\n')
    .reduce(
      (sum, paragraph) => sum + countLines(paragraph, font, fontSize, maxWidth),
      0,
    )
  return lines * fontSize * lineHeight
}

function childIndent(node: RichNode): number {
  if (node.type === 'list') return RICHTEXT_LIST_INDENT
  if (node.type === 'quote') return RICHTEXT_QUOTE_INDENT
  return 0
}

function hasBlockChildren(node: RichNode): boolean {
  return (node.children ?? []).some(
    (child) =>
      BLOCK_CONTAINERS.has(child.type) ||
      child.type === 'paragraph' ||
      child.type === 'heading',
  )
}

function stackHeight(nodes: readonly RichNode[], width: number): number {
  let total = 0
  for (const node of nodes) {
    total +=
      BLOCK_CONTAINERS.has(node.type) && hasBlockChildren(node)
        ? stackHeight(node.children ?? [], width - childIndent(node))
        : blockHeight(node, width - childIndent(node))
  }
  return total
}

const cache = new WeakMap<object, Map<number, number>>()

export function measureRichTextHeight(content: unknown, width: number): number {
  const root = contentRoot(content)
  const byWidth = cache.get(root)
  const cached = byWidth?.get(width)
  if (cached !== undefined) return cached
  const inner = width - RICHTEXT_PADDING * 2
  const blocks = root.children ?? []
  const body =
    blocks.length === 0
      ? blockHeight({ type: 'paragraph' }, inner)
      : stackHeight(blocks, inner)
  const height = body + RICHTEXT_PADDING * 2
  if (byWidth) byWidth.set(width, height)
  else cache.set(root, new Map([[width, height]]))
  return height
}

const CARD_DEFAULTS = {
  angle: 0,
  backgroundColor: '#ffec99',
  fillStyle: 'solid',
  opacity: 100,
  roughness: 0,
  roundness: { type: 3 },
  seed: 1,
  strokeColor: 'transparent',
  strokeStyle: 'solid',
  strokeWidth: 1,
} as const

function finite(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function withCardDefaults(el: RichTextElement): RichTextElement {
  const raw = el as unknown as Record<string, unknown>
  const missing = Object.keys(CARD_DEFAULTS).filter(
    (key) => raw[key] === undefined,
  )
  if (
    missing.length === 0 &&
    Number.isFinite(el.width) &&
    Number.isFinite(el.height)
  ) {
    return el
  }
  const next = { ...el } as unknown as Record<string, unknown>
  for (const key of missing) {
    next[key] = CARD_DEFAULTS[key as keyof typeof CARD_DEFAULTS]
  }
  next.width = finite(el.width)
  next.height = finite(el.height)
  return next as unknown as RichTextElement
}

export function resolveRichTextHeights(
  elements: readonly ExcalidrawElement[],
): ExcalidrawElement[] {
  let changed = false
  const next = elements.map((input) => {
    if (input.type !== 'richtext' || input.isDeleted) return input
    const el = withCardDefaults(input)
    const needed = measureRichTextHeight(el.content, el.width)
    const resolved = needed > el.height ? { ...el, height: needed } : el
    if (resolved !== input) changed = true
    return resolved
  })
  return changed ? next : (elements as ExcalidrawElement[])
}
