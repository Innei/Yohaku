import { describe, expect, it } from 'vitest'

import {
  insightsBlocks,
  parseYohakuRefUrl,
  YOHAKU_REF_SCHEME,
} from './insights-markup'

describe('insightsBlocks', () => {
  it('rewrites inline ref tags to yohaku-ref links and drops the meta trailer', () => {
    expect(
      insightsBlocks(
        [
          '## TL;DR',
          '',
          '灰度是缓存问题<ref quote="先缓存" section="§分流"/>。',
          '',
          '<!-- insights-meta: {"genre":"tech"} -->',
        ].join('\n'),
      ),
    ).toEqual([
      {
        type: 'markdown',
        markdown: `## TL;DR\n\n灰度是缓存问题[↖](${YOHAKU_REF_SCHEME}?quote=${encodeURIComponent('先缓存')}&section=${encodeURIComponent('§分流')})。`,
      },
    ])
  })

  it('splits mermaid fences out of surrounding prose', () => {
    expect(
      insightsBlocks(
        [
          'before',
          '',
          '```mermaid',
          'graph TD',
          '  A --> B',
          '```',
          '',
          'after',
        ].join('\n'),
      ),
    ).toEqual([
      { type: 'markdown', markdown: 'before' },
      { type: 'mermaid', content: 'graph TD\n  A --> B' },
      { type: 'markdown', markdown: 'after' },
    ])
  })

  it('returns empty for blank input', () => {
    expect(insightsBlocks('')).toEqual([])
    expect(insightsBlocks('   ')).toEqual([])
    expect(
      insightsBlocks('<!-- insights-meta: {"genre":"tech"} -->'),
    ).toEqual([])
  })
})

describe('parseYohakuRefUrl', () => {
  it('reads quote and section from a rewritten link', () => {
    expect(
      parseYohakuRefUrl(
        `${YOHAKU_REF_SCHEME}?quote=${encodeURIComponent('先缓存')}&section=${encodeURIComponent('§分流')}`,
      ),
    ).toEqual({ quote: '先缓存', section: '§分流' })
  })

  it('returns null for ordinary urls', () => {
    expect(parseYohakuRefUrl('https://innei.in')).toBeNull()
  })
})
