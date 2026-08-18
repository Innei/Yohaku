import { describe, expect, it } from 'vitest'

import { camelizeEnrichments } from './enrichments'
import { parseThinkingList } from './thinking'

describe('camelizeEnrichments', () => {
  it('camelizes entry fields but leaves URL keys intact', () => {
    expect(
      camelizeEnrichments({
        'https://example.com/foo_bar': {
          title: 'Foo',
          url: 'https://example.com/foo_bar',
          thumbnail_image: { url: 'https://cdn.example/a.jpg' },
          published_at: '2026-02-23',
        },
      }),
    ).toEqual({
      'https://example.com/foo_bar': {
        title: 'Foo',
        url: 'https://example.com/foo_bar',
        thumbnailImage: { url: 'https://cdn.example/a.jpg' },
        publishedAt: '2026-02-23',
      },
    })
  })

  it('returns null for missing or empty maps', () => {
    expect(camelizeEnrichments(undefined)).toBeNull()
    expect(camelizeEnrichments(null)).toBeNull()
    expect(camelizeEnrichments({})).toBeNull()
  })
})

describe('parseThinkingList', () => {
  it('unwraps the data envelope and keeps enrichment URL keys', () => {
    const items = parseThinkingList({
      data: [
        {
          id: 't1',
          content: 'https://example.com/foo_bar',
          up: 1,
          down: 0,
          comments_index: 2,
          allow_comment: true,
          created_at: '2026-08-01T00:00:00.000Z',
          modified_at: null,
          enrichments: {
            'https://example.com/foo_bar': {
              title: 'Foo',
              url: 'https://example.com/foo_bar',
              thumbnail_image: { url: 'https://cdn.example/a.jpg' },
            },
          },
        },
      ],
    })

    expect(items).toHaveLength(1)
    expect(items[0].commentsIndex).toBe(2)
    expect(items[0].enrichments).toEqual({
      'https://example.com/foo_bar': {
        title: 'Foo',
        url: 'https://example.com/foo_bar',
        thumbnailImage: { url: 'https://cdn.example/a.jpg' },
      },
    })
  })
})
