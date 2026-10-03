export type MarkdownChunk =
  | { kind: 'markdown'; text: string }
  | { content: string; kind: 'container'; name: string; params: string }

export interface PrepassResult {
  chunks: MarkdownChunk[]
  definitions: Record<string, string>
}

const CONTAINER_NAMES = new Set([
  'banner',
  'carousel',
  'caution',
  'danger',
  'error',
  'gallery',
  'grid',
  'important',
  'info',
  'masonry',
  'note',
  'success',
  'tip',
  'warn',
  'warning',
])

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/
const CONTAINER_OPEN = /^\s*:::\s*([\w-]+)\s*(?:\{(.*?)\})?\s*$/
const CONTAINER_CLOSE = /^\s*:::\s*$/
const FOOTNOTE_DEFINITION = /^\[\^([^\s\]]+)\]:\s*(.*)$/
const CONTINUATION = /^(?: {2,}|\t)\S/

interface Fence {
  char: string
  length: number
}

function fenceAfter(line: string, open: Fence | null): Fence | null {
  const match = FENCE_OPEN.exec(line)
  if (!match) return open
  const run = match[1]!
  if (!open) return { char: run[0]!, length: run.length }
  const closes =
    run[0] === open.char &&
    run.length >= open.length &&
    line.trim().length === run.length
  return closes ? null : open
}

function containerEnd(lines: string[], from: number): number {
  let fence: Fence | null = null
  for (let index = from; index < lines.length; index++) {
    const line = lines[index]!
    const next = fenceAfter(line, fence)
    if (fence || next) {
      fence = next
      continue
    }
    if (CONTAINER_CLOSE.test(line)) return index
  }
  return -1
}

export function prepass(source: string): PrepassResult {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  const chunks: MarkdownChunk[] = []
  const definitions: Record<string, string> = {}
  let buffer: string[] = []
  let fence: Fence | null = null

  const flush = () => {
    const text = buffer.join('\n')
    buffer = []
    if (text.trim()) chunks.push({ kind: 'markdown', text })
  }

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]!
    const next = fenceAfter(line, fence)
    if (fence || next) {
      fence = next
      buffer.push(line)
      continue
    }

    const definition = FOOTNOTE_DEFINITION.exec(line)
    if (definition) {
      const parts = [definition[2]!.trim()]
      while (index + 1 < lines.length && CONTINUATION.test(lines[index + 1]!)) {
        parts.push(lines[++index]!.trim())
      }
      definitions[definition[1]!] = parts.filter(Boolean).join(' ')
      continue
    }

    const open = CONTAINER_OPEN.exec(line)
    if (open && CONTAINER_NAMES.has(open[1]!.toLowerCase())) {
      const end = containerEnd(lines, index + 1)
      if (end !== -1) {
        flush()
        chunks.push({
          kind: 'container',
          name: open[1]!.toLowerCase(),
          params: (open[2] ?? '').trim(),
          content: lines.slice(index + 1, end).join('\n'),
        })
        index = end
        continue
      }
    }

    buffer.push(line)
  }
  flush()
  return { chunks, definitions }
}
