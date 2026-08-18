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
    expect(
      hrefForExternalUrl('https://example.com/categories/coding'),
    ).toEqual({
      pathname: '/categories/[slug]',
      params: { slug: 'coding' },
    })
    expect(
      hrefForExternalUrl('https://example.com/posts/tag/react'),
    ).toEqual({
      pathname: '/posts/tag/[name]',
      params: { name: 'react' },
    })
  })

  it('does not treat /posts/tag/:name as a post detail', () => {
    expect(
      hrefForExternalUrl('https://example.com/posts/tag/react'),
    ).not.toEqual({
      pathname: '/posts/[category]/[slug]',
      params: { category: 'tag', slug: 'react' },
    })
  })

  it('decodes tag and category params', () => {
    expect(
      hrefForExternalUrl('https://example.com/posts/tag/C%2B%2B'),
    ).toEqual({
      pathname: '/posts/tag/[name]',
      params: { name: 'C++' },
    })
    expect(
      hrefForExternalUrl('https://example.com/zh/categories/%E7%BC%96%E7%A8%8B'),
    ).toEqual({
      pathname: '/categories/[slug]',
      params: { slug: '编程' },
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
    expect(pathForExternalUrl('https://example.com/zh/categories/coding')).toBe(
      '/categories/coding',
    )
    expect(pathForExternalUrl('https://example.com/posts/tag/react')).toBe(
      '/posts/tag/react',
    )
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
    expect(rewriteIncomingPath('/en/categories/coding')).toBe(
      '/categories/coding',
    )
    expect(
      rewriteIncomingPath('https://example.com/zh/posts/tag/react'),
    ).toBe('/posts/tag/react')
  })

  it('sends claimed but unmapped site paths home', () => {
    expect(rewriteIncomingPath('/notes')).toBe('/')
    expect(rewriteIncomingPath('/notes/2024/01/01/slug')).toBe('/')
    expect(rewriteIncomingPath('/categories')).toBe('/')
  })

  it('passes through unrelated paths', () => {
    expect(rewriteIncomingPath('/dev-demos')).toBe('/dev-demos')
  })
})
