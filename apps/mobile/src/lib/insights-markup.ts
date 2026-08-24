export const YOHAKU_REF_SCHEME = 'yohaku-ref:'

export type InsightsBlock =
  | { markdown: string; type: 'markdown' }
  | { content: string; type: 'mermaid' }

export function parseYohakuRefUrl(
  url: string,
): { quote: string; section: string } | null {
  if (!url.startsWith(YOHAKU_REF_SCHEME)) return null
  const query = url.slice(YOHAKU_REF_SCHEME.length).replace(/^\?/, '')
  const params = new URLSearchParams(query)
  return {
    quote: params.get('quote') ?? '',
    section: params.get('section') ?? '',
  }
}

function stripInsightsMeta(markdown: string): string {
  /* eslint-disable unicorn/better-regex -- [\s\S] is the portable any-char; better-regex and match-any fight */
  return markdown.replaceAll(/<!--\s*insights-meta:[\s\S]*?-->/g, '')
  /* eslint-enable unicorn/better-regex */
}

function attr(attrs: string, name: string): string {
  const match = new RegExp(
    `${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`,
    'i',
  ).exec(attrs)
  return match?.[1] ?? match?.[2] ?? ''
}

function yohakuRefLink(quote: string, section: string): string {
  const params = [
    quote ? `quote=${encodeURIComponent(quote)}` : '',
    section ? `section=${encodeURIComponent(section)}` : '',
  ].filter(Boolean)
  return `[↖](${YOHAKU_REF_SCHEME}?${params.join('&')})`
}

function rewriteInsightsRefs(markdown: string): string {
  /* eslint-disable unicorn/better-regex -- [\s\S] is the portable any-char; better-regex and match-any fight */
  return markdown.replaceAll(
    /<ref\b([^>]*)(?:\/>|>[\s\S]*?<\/ref>)/gi,
    (_full, attrs: string) => yohakuRefLink(attr(attrs, 'quote'), attr(attrs, 'section')),
  )
  /* eslint-enable unicorn/better-regex */
}

export function insightsBlocks(markdown: string): InsightsBlock[] {
  const prepared = rewriteInsightsRefs(stripInsightsMeta(markdown)).trim()
  if (!prepared) return []

  const blocks: InsightsBlock[] = []
  const fence = /^```[ \t]*mermaid[ \t]*\n([\s\S]*?)^```[ \t]*$/gm
  let last = 0
  let match: RegExpExecArray | null
  while ((match = fence.exec(prepared)) !== null) {
    const before = prepared.slice(last, match.index).trim()
    if (before) blocks.push({ type: 'markdown', markdown: before })
    blocks.push({ type: 'mermaid', content: match[1].replace(/\n$/, '') })
    last = match.index + match[0].length
  }
  const after = prepared.slice(last).trim()
  if (after) blocks.push({ type: 'markdown', markdown: after })
  return blocks
}
