import { describe, expect, it } from 'vitest'

import type { ApiNote, ApiPost } from '@/api/types'

import {
  bodyIsStale,
  contentVersion,
  noteMetaFromApi,
  postBodyFromApi,
  postMetaFromApi,
  pruneBoundary,
  thinkingFromApi,
} from './merge'

const created = '2026-08-01T00:00:00.000Z'
const modified = '2026-08-05T00:00:00.000Z'

function apiPost(overrides: Partial<ApiPost> = {}): ApiPost {
  return {
    id: 'p1',
    slug: 'hello',
    title: '你好',
    summary: null,
    text: '截断的正文……',
    content: null,
    contentFormat: 'lexical',
    tags: ['a'],
    categoryId: null,
    category: { id: 'c1', name: '编程', slug: 'programming', type: 0 },
    readCount: 10,
    likeCount: 3,
    createdAt: created,
    modifiedAt: null,
    pinAt: null,
    ...overrides,
  }
}

describe('contentVersion', () => {
  it('falls back to createdAt when modifiedAt is null', () => {
    expect(contentVersion({ createdAt: created, modifiedAt: null })).toBe(
      new Date(created).getTime(),
    )
  })

  it('uses modifiedAt when it is newer', () => {
    expect(contentVersion({ createdAt: created, modifiedAt: modified })).toBe(
      new Date(modified).getTime(),
    )
  })
})

describe('bodyIsStale', () => {
  it('is stale without a fetched body', () => {
    expect(
      bodyIsStale({ createdAt: created, modifiedAt: null, bodyVersion: null }),
    ).toBe(true)
  })

  it('is stale when the entry was modified after the body fetch', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(created).getTime(),
      }),
    ).toBe(true)
  })

  it('is fresh when body version matches the content version', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: {
          aiGen: [],
          hasInsights: false,
          related: [],
          skills: [],
          summary: null,
          translation: null,
          tts: null,
        },
      }),
    ).toBe(false)
  })

  it('keeps a mixed partial translation retryable at the current body version', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: {
          aiGen: [],
          hasInsights: false,
          related: [],
          skills: [],
          summary: null,
          translation: {
            availableTranslations: ['ja', 'ko'],
            sourceLang: 'zh',
            state: 'partial',
            targetLang: 'en',
          },
          tts: null,
        },
      }),
    ).toBe(true)
  })

  it('revalidates a legacy translated body once its state is unknown', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: {
          aiGen: [],
          hasInsights: false,
          related: [],
          skills: [],
          summary: null,
          translation: {
            availableTranslations: [],
            sourceLang: 'zh',
            state: 'unknown',
            targetLang: 'en',
          },
          tts: null,
        },
      }),
    ).toBe(true)
  })

  it('is stale when cached notice meta predates the skills field', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: { related: [], summary: null, translation: null },
      }),
    ).toBe(true)
  })

  it('is stale when cached notice meta predates insights and aiGen', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: {
          related: [],
          skills: [],
          summary: null,
          translation: null,
        },
      }),
    ).toBe(true)
  })

  it('is stale when a cached body carries no notice meta yet', () => {
    // Migration 0003 backfills article_meta as NULL on rows whose body is
    // already fresh; without this they would never refetch and the notice
    // card would stay invisible for every pre-upgrade article.
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
        articleMeta: null,
      }),
    ).toBe(true)
  })
})

describe('pruneBoundary', () => {
  it('takes the oldest createdAt of the page', () => {
    expect(
      pruneBoundary([
        { createdAt: '2026-08-01T00:00:00.000Z' },
        { createdAt: '2026-05-01T00:00:00.000Z' },
        { createdAt: '2026-07-01T00:00:00.000Z' },
      ]),
    ).toBe(new Date('2026-05-01T00:00:00.000Z').getTime())
  })

  it('ignores a pinned entry older than the rest of the page', () => {
    // Production ships exactly this: a post pinned in 2026-03 sits at index 0
    // while indices 1..n are newer. Letting it set the bound would widen the
    // window to the whole archive and delete every page this sync never saw.
    const boundary = pruneBoundary([
      { createdAt: '2020-01-01T00:00:00.000Z', pinAt: '2026-03-25T00:00:00Z' },
      { createdAt: '2026-08-01T00:00:00.000Z', pinAt: null },
      { createdAt: '2026-07-01T00:00:00.000Z', pinAt: null },
    ])
    expect(boundary).toBe(new Date('2026-07-01T00:00:00.000Z').getTime())
  })

  it('yields no window when every entry is pinned', () => {
    expect(
      pruneBoundary([
        {
          createdAt: '2026-08-01T00:00:00.000Z',
          pinAt: '2026-08-02T00:00:00Z',
        },
      ]),
    ).toBeNull()
  })
})

describe('postMetaFromApi', () => {
  it('never carries body columns', () => {
    const row = postMetaFromApi(apiPost(), 'zh')
    expect('text' in row).toBe(false)
    expect('content' in row).toBe(false)
    expect('bodyVersion' in row).toBe(false)
  })

  it('prefers summary over truncated text for the excerpt', () => {
    expect(postMetaFromApi(apiPost({ summary: '摘要' }), 'zh').excerpt).toBe(
      '摘要',
    )
    expect(postMetaFromApi(apiPost(), 'zh').excerpt).toBe('截断的正文……')
  })

  it('flattens the embedded category', () => {
    const row = postMetaFromApi(apiPost(), 'zh')
    expect(row.categoryId).toBe('c1')
    expect(row.categorySlug).toBe('programming')
    expect(row.categoryName).toBe('编程')
  })

  it('carries contentFormat with markdown as the null default', () => {
    expect(postMetaFromApi(apiPost(), 'zh').contentFormat).toBe('lexical')
    expect(
      postMetaFromApi(apiPost({ contentFormat: null }), 'zh').contentFormat,
    ).toBe('markdown')
  })
})

describe('postBodyFromApi', () => {
  it('stamps bodyVersion with the content version', () => {
    const body = postBodyFromApi(apiPost({ modifiedAt: modified }), null)
    expect(body.bodyVersion).toBe(new Date(modified).getTime())
    expect(body.contentFormat).toBe('lexical')
  })

  it('persists the enrichment map alongside the body', () => {
    const enrichments = {
      'https://enriched.example.com/post': {
        title: 'Enriched',
        url: 'https://enriched.example.com/post',
      },
    }
    expect(postBodyFromApi(apiPost(), enrichments).enrichments).toBe(
      enrichments,
    )
  })

  it('keeps a persisted mixed translation retryable until the target is ready', () => {
    const post = apiPost({
      content: '{"root":{"children":[]}}',
      modifiedAt: modified,
      text: 'English heading\n\n这一段仍是中文。',
    })
    const translationMeta = (availableTranslations: string[]) => ({
      translation: {
        [post.id]: {
          article: {
            availableTranslations,
            isTranslated: true,
            sourceLang: 'zh',
            targetLang: 'en',
          },
        },
      },
    })

    const partial = postBodyFromApi(post, null, translationMeta(['ja', 'ko']))
    expect(partial.text).toContain('这一段仍是中文')
    expect(
      bodyIsStale({
        ...post,
        articleMeta: partial.articleMeta,
        bodyVersion: partial.bodyVersion,
      }),
    ).toBe(true)

    const ready = postBodyFromApi(
      { ...post, text: 'English heading\n\nThis paragraph is now English.' },
      null,
      translationMeta(['en', 'ja', 'ko']),
    )
    expect(
      bodyIsStale({
        ...post,
        articleMeta: ready.articleMeta,
        bodyVersion: ready.bodyVersion,
      }),
    ).toBe(false)
  })
})

describe('noteMetaFromApi', () => {
  it('maps summary-only list responses', () => {
    const note: ApiNote = {
      id: 'n1',
      nid: 42,
      title: '手记',
      summary: '概要',
      contentFormat: null,
      mood: '开心',
      weather: '晴',
      hasPassword: null,
      readCount: 1,
      likeCount: 0,
      createdAt: created,
      modifiedAt: null,
    }
    const row = noteMetaFromApi(note, 'zh')
    expect(row.excerpt).toBe('概要')
    expect(row.hasPassword).toBe(false)
    expect(row.contentFormat).toBe('markdown')
    expect('text' in row).toBe(false)
  })
})

describe('thinkingFromApi', () => {
  it('maps dates and counters', () => {
    const row = thinkingFromApi({
      id: 't1',
      content: '一点想法',
      up: 2,
      down: 0,
      createdAt: created,
      modifiedAt: null,
    })
    expect(row.createdAt).toEqual(new Date(created))
    expect(row.up).toBe(2)
    expect(row.enrichments).toBeNull()
  })

  it('persists the enrichment map', () => {
    const enrichments = {
      'https://example.com/foo_bar': {
        title: 'Foo',
        url: 'https://example.com/foo_bar',
      },
    }
    expect(
      thinkingFromApi({
        id: 't1',
        content: 'https://example.com/foo_bar',
        up: 0,
        down: 0,
        createdAt: created,
        modifiedAt: null,
        enrichments,
      }).enrichments,
    ).toBe(enrichments)
  })
})
