import type { ApiEnrichment } from '@/api/types'

export type ThinkingBlock =
  | { markdown: string; type: 'markdown' }
  | { enrichment: ApiEnrichment; href: string; type: 'card' }

/* eslint-disable unicorn/better-regex -- its fix strips the \] escape that
   regexp/strict requires, so the two autofixes loop forever */
const LINK_ONLY_LINE = /^(?:\[[^\]]+\]\((\S+?)\)|(https?:\/\/\S+))$/
/* eslint-enable unicorn/better-regex */

export function thinkingBlocks(
  content: string,
  enrichments: Record<string, ApiEnrichment> | null | undefined,
): ThinkingBlock[] {
  const blocks: ThinkingBlock[] = []
  let pending: string[] = []

  const flush = () => {
    const markdown = pending.join('\n').trim()
    if (markdown.length > 0) blocks.push({ type: 'markdown', markdown })
    pending = []
  }

  for (const line of content.split('\n')) {
    const match = LINK_ONLY_LINE.exec(line.trim())
    const href = match?.[1] ?? match?.[2]
    const enrichment = href ? enrichments?.[href] : undefined
    if (href && enrichment) {
      flush()
      blocks.push({ type: 'card', href, enrichment })
    } else {
      pending.push(line)
    }
  }
  flush()
  return blocks
}
