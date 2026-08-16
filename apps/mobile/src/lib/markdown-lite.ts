export type InlineSpan =
  | { text: string; type: 'text' }
  | { text: string; type: 'bold' }
  | { text: string; type: 'italic' }
  | { text: string; type: 'code' }
  | { href: string; text: string; type: 'link' }

export type CommentBlock =
  | { spans: InlineSpan[]; type: 'paragraph' }
  | { alt: string; src: string; type: 'image' }

type InlinePiece = InlineSpan | { alt: string; src: string; type: 'image' }

/* eslint-disable unicorn/better-regex -- its fix strips the \] escapes that
   regexp/strict requires, so the two autofixes loop forever */
const INLINE_TOKEN =
  /(`[^\n`]+`)|(\*\*[^\n*]+\*\*)|(\*[^\n*]+\*)|(_[^\n_]+_)|(!\[[^\n\]]*\]\([^\s)]+\))|(\[[^\n\]]+\]\([^\s)]+\))|(https?:\/\/[^\s<>[\]()]+)/g

const IMAGE_TOKEN = /^!\[([^\]]*)\]\(([^\s)]+)\)$/
const LINK_TOKEN = /^\[([^\]]+)\]\(([^\s)]+)\)$/
/* eslint-enable unicorn/better-regex */

function classify(token: string): InlinePiece {
  if (token.startsWith('`')) return { type: 'code', text: token.slice(1, -1) }
  if (token.startsWith('**')) return { type: 'bold', text: token.slice(2, -2) }
  if (token.startsWith('*') || token.startsWith('_'))
    return { type: 'italic', text: token.slice(1, -1) }
  const image = IMAGE_TOKEN.exec(token)
  if (image) return { type: 'image', alt: image[1], src: image[2] }
  const link = LINK_TOKEN.exec(token)
  if (link) return { type: 'link', text: link[1], href: link[2] }
  if (token.startsWith('http://') || token.startsWith('https://')) {
    const href = token.replace(/[!,.:;?。，：；]+$/, '')
    return { type: 'link', text: href, href }
  }
  return { type: 'text', text: token }
}

function parseInline(line: string): InlinePiece[] {
  const pieces: InlinePiece[] = []
  let cursor = 0
  INLINE_TOKEN.lastIndex = 0
  for (
    let match = INLINE_TOKEN.exec(line);
    match !== null;
    match = INLINE_TOKEN.exec(line)
  ) {
    if (match.index > cursor) {
      pieces.push({ type: 'text', text: line.slice(cursor, match.index) })
    }
    pieces.push(classify(match[0]))
    cursor = match.index + match[0].length
  }
  if (cursor < line.length) {
    pieces.push({ type: 'text', text: line.slice(cursor) })
  }
  return pieces
}

export function parseCommentMarkdown(
  text: string | null | undefined,
): CommentBlock[] {
  if (!text) return []
  const blocks: CommentBlock[] = []
  let spans: InlineSpan[] = []

  const flush = () => {
    if (spans.length > 0) {
      blocks.push({ type: 'paragraph', spans })
      spans = []
    }
  }

  for (const line of text.split('\n')) {
    if (line.trim().length === 0) {
      flush()
      continue
    }
    let lineStarted = false
    for (const piece of parseInline(line)) {
      if (piece.type === 'image') {
        flush()
        blocks.push(piece)
        continue
      }
      if (!lineStarted && spans.length > 0) {
        spans.push({ type: 'text', text: '\n' })
      }
      lineStarted = true
      spans.push(piece)
    }
  }
  flush()
  return blocks
}
