import { describe, expect, it } from 'vitest'

import type { ArticleNoticeMeta } from '@/api/article-meta'

import {
  aiRowCanFold,
  aiRowListenCaption,
  aiRowTrail,
  shouldShowAiRow,
  shouldShowArticleNotice,
} from './article-notice-model'

const empty = {
  aiGen: [],
  hasInsights: false,
  paywall: null,
  related: [],
  skills: [],
  summary: null,
  translation: null,
  tts: { available: true, stale: false },
} satisfies ArticleNoticeMeta

const withSummary = {
  ...empty,
  summary: {
    createdAt: null,
    source: 'ai' as const,
    text: '要点',
  },
}

describe('shouldShowArticleNotice', () => {
  it('shows the card when listen is the only extra', () => {
    expect(shouldShowArticleNotice(empty, true)).toBe(true)
    expect(shouldShowArticleNotice(empty, false)).toBe(false)
    expect(shouldShowArticleNotice(null, true)).toBe(true)
  })

  it('still shows a populated card when listen is off', () => {
    expect(shouldShowArticleNotice(withSummary, false)).toBe(true)
  })
})

describe('shouldShowAiRow', () => {
  it('shows the row for listen-only and for AI chips', () => {
    expect(shouldShowAiRow(empty, true)).toBe(true)
    expect(shouldShowAiRow(empty, false)).toBe(false)
    expect(shouldShowAiRow(withSummary, false)).toBe(true)
  })
})

describe('aiRowCanFold', () => {
  it('folds only when a chip exists', () => {
    expect(aiRowCanFold(empty)).toBe(false)
    expect(aiRowCanFold(withSummary)).toBe(true)
    expect(aiRowCanFold(null)).toBe(false)
  })
})

describe('aiRowTrail', () => {
  it('joins chips and stays chips while narrating', () => {
    expect(aiRowTrail(['摘要', '余白'])).toBe('摘要 · 余白')
    expect(aiRowTrail([])).toBeNull()
  })
})

describe('aiRowListenCaption', () => {
  it('is empty at rest so the row can show the listen label', () => {
    expect(
      aiRowListenCaption({
        current: 0,
        elapsed: 0,
        narrating: false,
        status: 'idle',
        total: 0,
      }),
    ).toBeNull()
  })

  it('shows time while narrating', () => {
    expect(
      aiRowListenCaption({
        current: 3,
        elapsed: 42,
        narrating: true,
        status: 'playing',
        total: 12,
      }),
    ).toBe('0:42 · 3/12')
  })

  it('uses an em dash while loading or before segments exist', () => {
    expect(
      aiRowListenCaption({
        current: 0,
        elapsed: 0,
        narrating: true,
        status: 'loading',
        total: 0,
      }),
    ).toBe('—')
  })
})
