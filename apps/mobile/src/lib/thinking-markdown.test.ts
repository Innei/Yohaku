import { describe, expect, it } from 'vitest'

import { thinkingBlocks } from './thinking-markdown'

const url = 'https://www.themoviedb.org/tv/281495'
const enrichment = {
  title: 'The Devil Between Us',
  url,
  category: 'media',
  subtype: 'tv',
}

describe('thinkingBlocks', () => {
  it('lifts a URL-only paragraph into a card when enrichment exists', () => {
    expect(thinkingBlocks(url, { [url]: enrichment })).toEqual([
      { type: 'card', href: url, enrichment },
    ])
  })

  it('keeps surrounding copy and cards the trailing URL paragraph', () => {
    expect(
      thinkingBlocks(`不管看几遍，神作就是神作\n\n${url}`, {
        [url]: enrichment,
      }),
    ).toEqual([
      {
        type: 'paragraph',
        spans: [{ type: 'text', text: '不管看几遍，神作就是神作' }],
      },
      { type: 'card', href: url, enrichment },
    ])
  })

  it('leaves a lone URL as a link when it is not enriched', () => {
    expect(thinkingBlocks(url, null)).toEqual([
      {
        type: 'paragraph',
        spans: [{ type: 'link', text: url, href: url }],
      },
    ])
  })
})
