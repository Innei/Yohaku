import { describe, expect, it } from 'vitest'

import type { ApiEnrichment } from '@/api/types'

import { soleCardVerbKey, thinkingBlocks } from './thinking-markdown'

const url = 'https://www.themoviedb.org/tv/281495'
const enrichment = {
  title: 'The Devil Between Us',
  url,
  category: 'media',
  subtype: 'tv',
}

describe('thinkingBlocks', () => {
  it('lifts a URL-only line into a card when enrichment exists', () => {
    expect(thinkingBlocks(url, { [url]: enrichment })).toEqual([
      { type: 'card', href: url, enrichment },
    ])
  })

  it('keeps surrounding copy and cards the trailing URL line', () => {
    expect(
      thinkingBlocks(`不管看几遍，神作就是神作\n\n${url}`, {
        [url]: enrichment,
      }),
    ).toEqual([
      { type: 'markdown', markdown: '不管看几遍，神作就是神作' },
      { type: 'card', href: url, enrichment },
    ])
  })

  it('cards a markdown link line pointing at an enriched URL', () => {
    expect(
      thinkingBlocks(`[看这个](${url})`, { [url]: enrichment }),
    ).toEqual([{ type: 'card', href: url, enrichment }])
  })

  it('leaves a lone URL as markdown when it is not enriched', () => {
    expect(thinkingBlocks(url, null)).toEqual([
      { type: 'markdown', markdown: url },
    ])
  })
})

function mediaEnrichment(
  url: string,
  category: string,
  subtype?: string,
): ApiEnrichment {
  return { url, title: 'T', category, subtype } as ApiEnrichment
}

const movie = 'https://themoviedb.org/movie/1'

function verbFor(content: string, map: Record<string, ApiEnrichment>) {
  return soleCardVerbKey(thinkingBlocks(content, map))
}

describe('soleCardVerbKey', () => {
  it('picks the verb when the whole entry is one enriched link', () => {
    expect(verbFor(movie, { [movie]: mediaEnrichment(movie, 'media', 'movie') })).toBe(
      'thinkingVerbWatched',
    )
  })

  it('falls back to the generic verb for unknown categories', () => {
    expect(verbFor(movie, { [movie]: mediaEnrichment(movie, 'article') })).toBe(
      'thinkingVerbLinked',
    )
  })

  it('stays silent when the entry also has prose', () => {
    expect(
      verbFor(`看完了\n${movie}`, {
        [movie]: mediaEnrichment(movie, 'media', 'movie'),
      }),
    ).toBeNull()
  })

  it('stays silent for multiple cards', () => {
    const book = 'https://books.example/1'
    expect(
      verbFor(`${movie}\n${book}`, {
        [movie]: mediaEnrichment(movie, 'media', 'movie'),
        [book]: mediaEnrichment(book, 'book'),
      }),
    ).toBeNull()
  })

  it('stays silent when the link has no enrichment', () => {
    expect(verbFor(movie, {})).toBeNull()
  })
})
