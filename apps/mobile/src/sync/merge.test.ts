import { describe, expect, it } from 'vitest'

import type { ApiNote, ApiPost } from '@/api/types'
import type { NoteRow, PostRow } from '@/db/schema'

import {
  bodyIsStale,
  calibrateNoteMeta,
  calibratePostMeta,
  contentVersion,
  decorationIsStale,
  listBodyPatchFromLine,
  needsListBody,
  noteMetaFromApi,
  postBodyFromApi,
  postMetaFromApi,
  pruneBoundary,
  thinkingFromApi,
  topicFromApi,
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
      }),
    ).toBe(false)
  })

  it('stays fresh when notice meta is still missing', () => {
    expect(
      bodyIsStale({
        createdAt: created,
        modifiedAt: modified,
        bodyVersion: new Date(modified).getTime(),
      }),
    ).toBe(false)
  })
})

describe('decorationIsStale', () => {
  it('is stale when a cached body carries no notice meta yet', () => {
    expect(decorationIsStale({ articleMeta: null })).toBe(true)
  })

  it('keeps a mixed partial translation retryable', () => {
    expect(
      decorationIsStale({
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
      decorationIsStale({
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
      decorationIsStale({
        articleMeta: { related: [], summary: null, translation: null },
      }),
    ).toBe(true)
  })

  it('is stale when cached notice meta predates insights and aiGen', () => {
    expect(
      decorationIsStale({
        articleMeta: {
          related: [],
          skills: [],
          summary: null,
          translation: null,
        },
      }),
    ).toBe(true)
  })
})

describe('listBodyPatchFromLine', () => {
  it('skips missing and unchanged lines', () => {
    expect(
      listBodyPatchFromLine({ id: 'p1', kind: 'post', missing: true }),
    ).toEqual({ kind: 'skip' })
    expect(
      listBodyPatchFromLine({ id: 'p1', kind: 'post', unchanged: true }),
    ).toEqual({ kind: 'skip' })
  })

  it('marks a password note without writing a body', () => {
    expect(
      listBodyPatchFromLine({ id: 'n1', kind: 'note', hasPassword: true }),
    ).toEqual({ kind: 'password' })
  })

  it('persists a complete lexical body with a version stamp', () => {
    expect(
      listBodyPatchFromLine({
        id: 'p1',
        kind: 'post',
        content: '{"root":{}}',
        contentFormat: 'lexical',
        createdAt: created,
        modifiedAt: modified,
        text: 'hello',
      }),
    ).toEqual({
      kind: 'body',
      bodyVersion: new Date(modified).getTime(),
      content: '{"root":{}}',
      contentFormat: 'lexical',
      text: 'hello',
    })
  })

  it('skips markdown and password notes for list ingest', () => {
    expect(
      needsListBody({
        bodyVersion: null,
        contentFormat: 'markdown',
        createdAt: created,
        modifiedAt: null,
      }),
    ).toBe(false)
    expect(
      needsListBody({
        bodyVersion: null,
        createdAt: created,
        hasPassword: true,
        modifiedAt: null,
      }),
    ).toBe(false)
    expect(
      needsListBody({
        bodyVersion: null,
        contentFormat: 'lexical',
        createdAt: created,
        modifiedAt: null,
      }),
    ).toBe(true)
  })

  it('keeps a paywall teaser unversioned so detail can refetch', () => {
    expect(
      listBodyPatchFromLine({
        id: 'p1',
        kind: 'post',
        content: '{"root":{}}',
        contentFormat: 'lexical',
        createdAt: created,
        locked: true,
        modifiedAt: modified,
        text: 'teaser',
      }),
    ).toMatchObject({ kind: 'body', bodyVersion: null, text: 'teaser' })
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

  it('leaves a missing contentFormat unset instead of inventing markdown', () => {
    expect(postMetaFromApi(apiPost(), 'zh').contentFormat).toBe('lexical')
    expect(
      postMetaFromApi(apiPost({ contentFormat: null }), 'zh').contentFormat,
    ).toBeNull()
  })
})

describe('calibratePostMeta', () => {
  const cached = {
    ...postMetaFromApi(apiPost(), 'zh'),
    excerpt: '详情里的译文摘要',
    contentFormat: 'lexical' as const,
    text: '完整正文',
    content: '{"root":{}}',
    bodyVersion: new Date(created).getTime(),
    enrichments: null,
    articleMeta: {
      aiGen: [],
      hasInsights: false,
      related: [],
      skills: [],
      summary: null,
      translation: {
        availableTranslations: ['en'],
        sourceLang: 'zh',
        state: 'ready' as const,
        targetLang: 'en',
      },
      tts: null,
      paywall: null,
    },
  }

  it('keeps cached format, excerpt and body when the list row is sparse', () => {
    const incoming = postMetaFromApi(
      apiPost({
        contentFormat: null,
        summary: null,
        text: null,
        title: '分类里的标题',
      }),
      'zh',
    )
    const row = calibratePostMeta(cached as PostRow, incoming)
    expect(row.title).toBe('分类里的标题')
    expect(row.contentFormat).toBe('lexical')
    expect(row.excerpt).toBe('详情里的译文摘要')
    expect(row.content).toBe('{"root":{}}')
    expect(row.articleMeta?.translation?.state).toBe('ready')
  })

  it('fills a new row without turning a missing format into markdown', () => {
    const incoming = postMetaFromApi(apiPost({ contentFormat: null }), 'zh')
    expect(calibratePostMeta(undefined, incoming).contentFormat).toBeNull()
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
        bodyVersion: partial.bodyVersion,
      }),
    ).toBe(false)
    expect(decorationIsStale({ articleMeta: partial.articleMeta })).toBe(true)

    const ready = postBodyFromApi(
      { ...post, text: 'English heading\n\nThis paragraph is now English.' },
      null,
      translationMeta(['en', 'ja', 'ko']),
    )
    expect(
      bodyIsStale({
        ...post,
        bodyVersion: ready.bodyVersion,
      }),
    ).toBe(false)
    expect(decorationIsStale({ articleMeta: ready.articleMeta })).toBe(false)
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
    expect(row.hasPassword).toBeNull()
    expect(row.contentFormat).toBeNull()
    expect(row.topicId).toBeNull()
    expect('text' in row).toBe(false)
  })

  it('prefers topicId and falls back to the embedded topic', () => {
    const note: ApiNote = {
      id: 'n1',
      nid: 42,
      title: '手记',
      contentFormat: 'lexical',
      mood: null,
      weather: null,
      hasPassword: false,
      readCount: 1,
      likeCount: 0,
      createdAt: created,
      modifiedAt: null,
      topicId: 't1',
    }
    expect(noteMetaFromApi(note, 'zh').topicId).toBe('t1')
    expect(
      noteMetaFromApi(
        {
          ...note,
          topicId: null,
          topic: {
            id: 't2',
            name: '北海道',
            slug: 'hokkaido',
            description: '',
            introduce: null,
            icon: null,
            createdAt: created,
          },
        },
        'zh',
      ).topicId,
    ).toBe('t2')
  })
})

describe('calibrateNoteMeta', () => {
  it('keeps a cached lexical body when the list omits format and excerpt', () => {
    const incoming = noteMetaFromApi(
      {
        id: 'n1',
        nid: 42,
        title: '列表标题',
        summary: null,
        contentFormat: null,
        mood: null,
        weather: null,
        hasPassword: false,
        readCount: 4,
        likeCount: 1,
        createdAt: created,
        modifiedAt: null,
      },
      'zh',
    )
    const row = calibrateNoteMeta(
      {
        ...incoming,
        title: '详情标题',
        excerpt: '详情摘要',
        contentFormat: 'lexical',
        hasPassword: false,
        text: '正文',
        content: '{"root":{}}',
        bodyVersion: new Date(created).getTime(),
        enrichments: null,
        articleMeta: null,
        topicId: 't1',
      } as NoteRow,
      incoming,
    )
    expect(row.title).toBe('列表标题')
    expect(row.excerpt).toBe('详情摘要')
    expect(row.contentFormat).toBe('lexical')
    expect(row.text).toBe('正文')
    expect(row.topicId).toBe('t1')
  })
})

describe('topicFromApi', () => {
  it('maps dates and empty introduce', () => {
    const row = topicFromApi({
      id: 't1',
      name: '北海道',
      slug: 'hokkaido',
      description: 'desc',
      introduce: null,
      icon: 'https://example.com/i.png',
      createdAt: created,
    }, 'zh')
    expect(row.lang).toBe('zh')
    expect(row.createdAt).toEqual(new Date(created))
    expect(row.icon).toBe('https://example.com/i.png')
    expect(row.introduce).toBeNull()
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
