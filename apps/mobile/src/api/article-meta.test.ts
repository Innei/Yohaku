import { describe, expect, it } from 'vitest'

import {
  aiNoticeChips,
  extractArticleMeta,
  isEmptyArticleMeta,
  noticeMetaNeedsBackfill,
} from './article-meta'
import { camelize } from './camelize'

// Trimmed from a real GET /posts/experience/... response so the snake_case
// keys and the id-keyed translation map stay honest.
const rawMeta = {
  view: 'detail',
  insights: { has_in_locale: true },
  summary: {
    id: '133259630137065597',
    text: '作者反思了高强度使用AI带来的倦怠感。',
    lang: 'zh',
    created_at: '2026-02-28T17:05:46.316Z',
  },
  related: [
    {
      id: '136759165996503040',
      title: '为什么决定先观察 Remix',
      slug: 'why-observe-remix-first',
      category_id: '133259626399940608',
      category: {
        id: '133259626399940608',
        name: '折腾',
        slug: 'tinkering',
        type: 0,
      },
    },
  ],
  translation: {
    '137433915383091200': {
      article: {
        is_translated: true,
        source_lang: 'zh',
        target_lang: 'en',
        model: 'deepseek/deepseek-v4-pro',
        available_translations: ['ko', 'ja', 'en'],
      },
    },
  },
}

const meta = () => camelize<unknown>(structuredClone(rawMeta))

describe('extractArticleMeta', () => {
  it('flattens the id-keyed translation map', () => {
    const result = extractArticleMeta(meta())
    expect(result?.translation).toEqual({
      availableTranslations: ['ko', 'ja', 'en'],
      sourceLang: 'zh',
      state: 'ready',
      targetLang: 'en',
    })
  })

  it('keeps a mixed partial translation retryable', () => {
    const raw = structuredClone(rawMeta)
    raw.translation['137433915383091200'].article.available_translations = [
      'ko',
      'ja',
    ]

    expect(extractArticleMeta(camelize(raw))?.translation).toEqual({
      availableTranslations: ['ko', 'ja'],
      sourceLang: 'zh',
      state: 'partial',
      targetLang: 'en',
    })
  })

  it('revalidates legacy translation metadata without availability', () => {
    const raw = structuredClone(rawMeta)
    delete (
      raw.translation['137433915383091200'].article as Partial<
        (typeof rawMeta.translation)['137433915383091200']['article']
      >
    ).available_translations

    expect(extractArticleMeta(camelize(raw))?.translation?.state).toBe(
      'unknown',
    )
  })

  it('drops translation when the article was not translated', () => {
    const raw = structuredClone(rawMeta)
    raw.translation['137433915383091200'].article.is_translated = false
    expect(extractArticleMeta(camelize(raw))?.translation).toBeNull()
  })

  it('keeps the category slug needed to build a post route', () => {
    const [ref] = extractArticleMeta(meta())!.related
    expect(ref.categorySlug).toBe('tinkering')
    expect(ref.slug).toBe('why-observe-remix-first')
  })

  it('marks the AI summary and carries its date', () => {
    const summary = extractArticleMeta(meta())?.summary
    expect(summary?.source).toBe('ai')
    expect(summary?.createdAt).toBe('2026-02-28T17:05:46.316Z')
  })

  it('prefers a hand-written summary over the AI one', () => {
    const summary = extractArticleMeta(meta(), '手写摘要')?.summary
    expect(summary).toEqual({
      createdAt: null,
      source: 'author',
      text: '手写摘要',
    })
  })

  it('ignores a blank hand-written summary', () => {
    expect(extractArticleMeta(meta(), '   ')?.summary?.source).toBe('ai')
  })

  it('returns an empty object — never null — when nothing is present', () => {
    // A null column has to keep meaning "never fetched" for the backfill in
    // bodyIsStale, so the extractor must not produce null itself.
    const empty = {
      aiGen: [],
      hasInsights: false,
      related: [],
      skills: [],
      summary: null,
      translation: null,
      tts: null,
      paywall: null,
    }
    expect(extractArticleMeta({ view: 'detail' })).toEqual(empty)
    expect(isEmptyArticleMeta(extractArticleMeta({ view: 'detail' }))).toBe(
      true,
    )
    expect(
      extractArticleMeta({ related: [], tts: { available: false } }),
    ).toEqual(empty)
  })

  it('keeps available tts meta and drops the rest', () => {
    expect(
      extractArticleMeta({
        tts: { available: true, stale: true, lang: 'zh', blockCount: 12 },
      }).tts,
    ).toEqual({ available: true, stale: true })
  })

  it('does not treat tts-only as a notice card', () => {
    expect(
      isEmptyArticleMeta(
        extractArticleMeta({ tts: { available: true, stale: false } }),
      ),
    ).toBe(true)
  })

  it('degrades instead of throwing on malformed payloads', () => {
    const empty = {
      aiGen: [],
      hasInsights: false,
      related: [],
      skills: [],
      summary: null,
      translation: null,
      tts: null,
      paywall: null,
    }
    expect(extractArticleMeta(null)).toEqual(empty)
    expect(extractArticleMeta('nonsense')).toEqual(empty)
    expect(
      extractArticleMeta({
        summary: { text: 42 },
        related: 'not-an-array',
        translation: [],
        skills: 'not-an-array',
      }),
    ).toEqual(empty)
  })

  it('picks attached AI skills that have an id and a name', () => {
    const result = extractArticleMeta({
      skills: [
        {
          id: '156480986278793216',
          name: 'edge-canary-split',
          description: 'Use when rolling out a rewrite.',
        },
        { name: 'missing-id' },
        { id: 's2' },
        { id: 's3', name: 'kept', description: 42 },
      ],
    })
    expect(result.skills).toEqual([
      {
        description: 'Use when rolling out a rewrite.',
        id: '156480986278793216',
        name: 'edge-canary-split',
      },
      { description: '', id: 's3', name: 'kept' },
    ])
  })

  it('does not throw when cached meta is missing the skills field', () => {
    expect(
      isEmptyArticleMeta({
        related: [],
        summary: null,
        translation: null,
      }),
    ).toBe(true)
  })

  it('treats a skills-only payload as populated', () => {
    expect(
      isEmptyArticleMeta(
        extractArticleMeta({
          skills: [{ id: 's1', name: 'edge-canary-split' }],
        }),
      ),
    ).toBe(false)
  })

  it('reports a populated meta as non-empty', () => {
    expect(isEmptyArticleMeta(extractArticleMeta(meta()))).toBe(false)
    expect(isEmptyArticleMeta(null)).toBe(true)
  })

  it('skips related entries missing an id or title', () => {
    const result = extractArticleMeta({
      related: [{ title: 'no id' }, { id: 'x' }, { id: 'y', title: 'kept' }],
    })
    expect(result?.related).toHaveLength(1)
    expect(result?.related[0].title).toBe('kept')
  })

  it('carries nid for note refs that have no slug', () => {
    const result = extractArticleMeta({
      related: [{ id: 'n1', title: '手记', nid: 218 }],
    })
    expect(result?.related[0]).toMatchObject({
      categorySlug: null,
      nid: 218,
      slug: null,
    })
  })

  it('reads insights.hasInLocale from the camelized envelope', () => {
    expect(extractArticleMeta(meta()).hasInsights).toBe(true)
    expect(
      extractArticleMeta({ insights: { hasInLocale: false } }).hasInsights,
    ).toBe(false)
  })

  it('flattens aiGen from the document meta', () => {
    expect(extractArticleMeta({}, null, 2).aiGen).toEqual([2])
    expect(extractArticleMeta({}, null, [4, 9]).aiGen).toEqual([4, 9])
    expect(extractArticleMeta({}, null, '口述').aiGen).toEqual(['口述'])
    expect(extractArticleMeta({}, null, [2, null, '']).aiGen).toEqual([2])
  })

  it('treats insights-only as populated and aiGen-only as empty', () => {
    expect(
      isEmptyArticleMeta(
        extractArticleMeta({ insights: { hasInLocale: true } }),
      ),
    ).toBe(false)
    expect(isEmptyArticleMeta(extractArticleMeta({}, null, 2))).toBe(true)
  })

  it('does not throw when listing chips on cached meta without aiGen', () => {
    expect(
      aiNoticeChips({
        skills: [{ description: '', id: 's1', name: 'edge-canary-split' }],
        summary: null,
      }),
    ).toEqual(['skills'])
  })

  it('lists every AI chip that the fold should surface together', () => {
    expect(
      aiNoticeChips(
        extractArticleMeta(
          {
            insights: { hasInLocale: true },
            summary: { text: '要点' },
            skills: [{ id: 's1', name: 'edge-canary-split' }],
          },
          null,
          2,
        ),
      ),
    ).toEqual(['summary', 'insights', 'skills'])
  })

  it('flags cached meta that predates insights and aiGen as needing backfill', () => {
    expect(
      noticeMetaNeedsBackfill({
        related: [],
        skills: [],
        summary: null,
        translation: null,
      }),
    ).toBe(true)
    expect(
      noticeMetaNeedsBackfill({
        aiGen: [],
        hasInsights: false,
        related: [],
        skills: [],
        summary: null,
        translation: null,
      }),
    ).toBe(true)
    expect(
      noticeMetaNeedsBackfill({
        aiGen: [],
        hasInsights: false,
        related: [],
        skills: [],
        summary: null,
        translation: null,
        tts: null,
      }),
    ).toBe(true)
    expect(
      noticeMetaNeedsBackfill({
        aiGen: [],
        hasInsights: false,
        related: [],
        skills: [],
        summary: null,
        translation: null,
        tts: null,
        paywall: null,
      }),
    ).toBe(false)
  })
})

describe('extractArticleMeta paywall', () => {
  it('captures a locked paywall', () => {
    expect(extractArticleMeta({ paywall: { locked: true } }).paywall).toEqual({
      locked: true,
    })
  })

  it('captures an unlocked paywall', () => {
    expect(extractArticleMeta({ paywall: { locked: false } }).paywall).toEqual({
      locked: false,
    })
  })

  it('returns null paywall when the envelope has none', () => {
    expect(extractArticleMeta({}).paywall).toBeNull()
  })

  it('ignores a malformed paywall blob', () => {
    expect(
      extractArticleMeta({ paywall: { previewBlocks: 3 } }).paywall,
    ).toBeNull()
  })
})
