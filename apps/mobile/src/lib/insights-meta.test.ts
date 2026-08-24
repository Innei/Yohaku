import { describe, expect, it } from 'vitest'

import {
  extractInsightsMeta,
  formatInsightsMetaLine,
  numToHan,
} from './insights-meta'

describe('extractInsightsMeta', () => {
  it('reads the last insights-meta trailer', () => {
    const markdown = [
      '## TL;DR',
      '',
      'body',
      '<!-- insights-meta: {"difficulty":"easy","genre":"tutorial","reading_time_min":3} -->',
    ].join('\n')
    expect(extractInsightsMeta(markdown)).toEqual({
      difficulty: 'easy',
      genre: 'tutorial',
      readingTimeMin: 3,
    })
  })

  it('returns null when the trailer is missing or malformed', () => {
    expect(extractInsightsMeta('no trailer')).toBeNull()
    expect(
      extractInsightsMeta(
        '<!-- insights-meta: {"difficulty":"easy","genre":"tutorial"} -->',
      ),
    ).toBeNull()
  })
})

describe('numToHan', () => {
  it('converts 1–99', () => {
    expect(numToHan(1)).toBe('一')
    expect(numToHan(10)).toBe('十')
    expect(numToHan(12)).toBe('十二')
    expect(numToHan(21)).toBe('二十一')
    expect(numToHan(100)).toBeNull()
  })
})

describe('formatInsightsMetaLine', () => {
  const catalog: Record<string, string> = {
    metaTime: '{count} 分钟',
    metaLiteraryTime: '{count}分而尽',
    metaLiteraryTimeFallback: '{count} 分',
    difficulty_medium: '中等',
    difficultyLiterary_medium: '中等',
    genre_tutorial: '教程',
    genreLiterary_tutorial: '指要',
  }
  const t = (key: string, vars?: Record<string, string | number>) => {
    let value = catalog[key] ?? key
    if (vars) {
      for (const [name, next] of Object.entries(vars)) {
        value = value.replaceAll(`{${name}}`, String(next))
      }
    }
    return value
  }

  it('joins plain parts', () => {
    expect(
      formatInsightsMetaLine(
        { difficulty: 'medium', genre: 'tutorial', readingTimeMin: 4 },
        t,
        false,
      ),
    ).toBe('4 分钟 · 中等 · 教程')
  })

  it('uses literary time and genre when asked', () => {
    expect(
      formatInsightsMetaLine(
        { difficulty: 'medium', genre: 'tutorial', readingTimeMin: 4 },
        t,
        true,
      ),
    ).toBe('四分而尽 · 中等 · 指要')
  })
})
