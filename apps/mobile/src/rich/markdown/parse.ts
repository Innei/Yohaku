import { YohakuNative } from '@modules/yohaku'

import { buildMarkdownArticle, type MarkdownArticle } from './article'
import type { MarkdownNode } from './ast'
import { canRenderMarkdown } from './support'

function parseMarkdown(markdown: string): MarkdownNode {
  return JSON.parse(YohakuNative.parseMarkdown(markdown)) as MarkdownNode
}

export function markdownArticle(source: string): MarkdownArticle | null {
  if (!canRenderMarkdown()) return null
  try {
    const article = buildMarkdownArticle(source, parseMarkdown)
    return article.segments.length > 0 ? article : null
  } catch {
    return null
  }
}
