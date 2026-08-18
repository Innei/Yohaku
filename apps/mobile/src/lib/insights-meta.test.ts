import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  extractInsightsMeta,
  formatInsightsMetaLine,
  insightsWebViewDom,
  numToHan,
} from './insights-meta'
import { getSiteUrl } from './site-url'

const require = createRequire(import.meta.url)
const { findWorkspaceRoot, resolveOverlayDir } =
  require('../../workspace-root.cjs') as {
    findWorkspaceRoot: (startDir: string) => string
    resolveOverlayDir: (workspaceRoot: string) => string | null
  }

const mobileRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)
const overlayPresent = resolveOverlayDir(findWorkspaceRoot(mobileRoot)) !== null

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

describe('insightsWebViewDom', () => {
  it('opts the insights surface out of the article pool', () => {
    expect(insightsWebViewDom()).toMatchObject({
      headerTitle: '',
      matchContents: false,
      pooled: false,
      scrollEdgeEffects: { bottom: 'automatic', top: 'automatic' },
      scrollEnabled: true,
      siteReferer: overlayPresent ? getSiteUrl() : '',
    })
    expect(
      insightsWebViewDom({
        meta: '4 分钟 · 简单 · 散文',
        metaColor: '#6f6d66',
        title: '余白',
        titleColor: '#24231f',
      }),
    ).toMatchObject({
      headerMeta: '4 分钟 · 简单 · 散文',
      headerTitle: '余白',
      headerTitleColor: '#24231f',
    })
  })
})
