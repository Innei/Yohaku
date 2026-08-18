import type { ApiEnrichment } from '@/api/types'

import type { CommentBlock, InlineSpan } from './markdown-lite'
import { parseCommentMarkdown } from './markdown-lite'

export type ThinkingBlock =
  CommentBlock | { enrichment: ApiEnrichment; href: string; type: 'card' }

export function thinkingBlocks(
  content: string,
  enrichments: Record<string, ApiEnrichment> | null | undefined,
): ThinkingBlock[] {
  return parseCommentMarkdown(content).map((block) => {
    if (block.type !== 'paragraph') return block
    const href = soleLinkHref(block.spans)
    const enrichment = href ? enrichments?.[href] : undefined
    if (href && enrichment) return { type: 'card', href, enrichment }
    return block
  })
}

function soleLinkHref(spans: InlineSpan[]): string | null {
  if (spans.length !== 1) return null
  const span = spans[0]
  return span.type === 'link' ? span.href : null
}
