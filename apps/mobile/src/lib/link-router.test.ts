import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  hrefForExternalUrl,
  pathForExternalUrl,
  rewriteIncomingPath,
} from './link-router'
import { hydrateSiteFromOwner, resetSiteRuntime } from './site-url'

describe('hrefForExternalUrl', () => {
  beforeEach(() => {
    hydrateSiteFromOwner('https://example.com', 'example.com')
  })
  afterEach(() => {
    resetSiteRuntime()
  })

  it('maps unprefixed post and note URLs', () => {
    expect(
      hrefForExternalUrl('https://example.com/posts/coding/hello'),
    ).toEqual({
      pathname: '/posts/[category]/[slug]',
      params: { category: 'coding', slug: 'hello' },
    })
    expect(hrefForExternalUrl('https://www.example.com/notes/42')).toEqual({
      pathname: '/notes/[nid]',
      params: { nid: '42' },
    })
    expect(hrefForExternalUrl('https://example.com/notes/series')).toEqual({
      pathname: '/series',
    })
    expect(
      hrefForExternalUrl('https://example.com/notes/series/year-summary'),
    ).toEqual({
      pathname: '/series/[slug]',
      params: { slug: 'year-summary' },
    })
  })

  it('strips a locale prefix before matching', () => {
    expect(
      hrefForExternalUrl('https://example.com/en/posts/coding/hello'),
    ).toEqual({
      pathname: '/posts/[category]/[slug]',
      params: { category: 'coding', slug: 'hello' },
    })
    expect(hrefForExternalUrl('https://example.com/zh-TW/notes/7')).toEqual({
      pathname: '/notes/[nid]',
      params: { nid: '7' },
    })
  })

  it('ignores off-site and non-detail paths', () => {
    expect(
      hrefForExternalUrl('https://other.test/posts/coding/hello'),
    ).toBeNull()
    expect(hrefForExternalUrl('https://example.com/thinking')).toBeNull()
    expect(
      hrefForExternalUrl('https://example.com/notes/2024/01/01/slug'),
    ).toBeNull()
  })
})

describe('pathForExternalUrl', () => {
  beforeEach(() => {
    hydrateSiteFromOwner('https://example.com', 'example.com')
  })
  afterEach(() => {
    resetSiteRuntime()
  })

  it('fills the expo-router pathname', () => {
    expect(pathForExternalUrl('https://example.com/ja/posts/life/tea')).toBe(
      '/posts/life/tea',
    )
    expect(pathForExternalUrl('https://example.com/notes/9/')).toBe('/notes/9')
    expect(pathForExternalUrl('https://example.com/notes/series')).toBe(
      '/series',
    )
    expect(
      pathForExternalUrl('https://example.com/en/notes/series/year-summary'),
    ).toBe('/series/year-summary')
  })
})

describe('rewriteIncomingPath', () => {
  beforeEach(() => {
    hydrateSiteFromOwner('https://example.com', 'example.com')
  })
  afterEach(() => {
    resetSiteRuntime()
  })

  it('leaves custom schemes alone', () => {
    expect(rewriteIncomingPath('yohaku://auth/callback')).toBe(
      'yohaku://auth/callback',
    )
    expect(rewriteIncomingPath('exp+yohaku://expo-development-client')).toBe(
      'exp+yohaku://expo-development-client',
    )
  })

  it('rewrites universal-link paths onto native routes', () => {
    expect(rewriteIncomingPath('/en/posts/coding/hello')).toBe(
      '/posts/coding/hello',
    )
    expect(rewriteIncomingPath('https://example.com/notes/12')).toBe(
      '/notes/12',
    )
    expect(rewriteIncomingPath('/notes/series')).toBe('/series')
    expect(
      rewriteIncomingPath('https://example.com/notes/series/hokkaido'),
    ).toBe('/series/hokkaido')
  })

  it('sends claimed but unmapped site paths home', () => {
    expect(rewriteIncomingPath('/notes')).toBe('/')
    expect(rewriteIncomingPath('/notes/2024/01/01/slug')).toBe('/')
  })

  it('passes through unrelated paths', () => {
    expect(rewriteIncomingPath('/dev-demos')).toBe('/dev-demos')
  })
})
