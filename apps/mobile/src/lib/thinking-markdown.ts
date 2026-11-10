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

export type ThinkingVerbKey =
  | 'thinkingVerbWatched'
  | 'thinkingVerbRead'
  | 'thinkingVerbListened'
  | 'thinkingVerbStudied'
  | 'thinkingVerbLinked'

function verbKeyFor(enrichment: ApiEnrichment): ThinkingVerbKey {
  const category = enrichment.category ?? ''
  const subtype = enrichment.subtype ?? ''
  if (category === 'media') {
    if (subtype === 'movie' || subtype === 'tv') return 'thinkingVerbWatched'
    if (subtype === 'book') return 'thinkingVerbRead'
    if (subtype === 'music' || subtype === 'album' || subtype === 'song')
      return 'thinkingVerbListened'
  }
  if (category === 'book') return 'thinkingVerbRead'
  if (category === 'music') return 'thinkingVerbListened'
  if (category === 'academic') return 'thinkingVerbStudied'
  return 'thinkingVerbLinked'
}

export function soleCardVerbKey(
  blocks: ThinkingBlock[],
): ThinkingVerbKey | null {
  if (blocks.length !== 1) return null
  const [block] = blocks
  return block.type === 'card' ? verbKeyFor(block.enrichment) : null
}
