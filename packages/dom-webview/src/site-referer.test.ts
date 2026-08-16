import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  ASSET_SCHEME,
  buildMediaRewriteScript,
  normalizeSiteReferer,
  parseAssetRequest,
  rewriteMediaUrl,
  rewriteSrcSet,
} from './site-referer'

const packageDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

describe('normalizeSiteReferer', () => {
  it('turns the site origin into a trailing-slash Referer', () => {
    expect(normalizeSiteReferer('https://example.com')).toBe(
      'https://example.com/',
    )
  })

  it('returns empty when the caller supplies no site URL', () => {
    expect(normalizeSiteReferer('')).toBe('')
    expect(normalizeSiteReferer('example.com')).toBe('')
  })
})

describe('rewriteMediaUrl', () => {
  it('sends a CDN image through the asset scheme with the site Referer', () => {
    const rewritten = rewriteMediaUrl(
      'https://cdn.example.com/mx-space/2026/0805/a.png',
      'https://example.com',
    )
    expect(rewritten.startsWith(`${ASSET_SCHEME}://image?`)).toBe(true)
    expect(parseAssetRequest(rewritten)).toEqual({
      referer: 'https://example.com/',
      url: 'https://cdn.example.com/mx-space/2026/0805/a.png',
    })
  })

  it('leaves data, blob, local, and already-rewritten URLs alone', () => {
    const site = 'https://example.com'
    expect(rewriteMediaUrl('data:image/png;base64,abc', site)).toBe(
      'data:image/png;base64,abc',
    )
    expect(rewriteMediaUrl('blob:http://localhost:8081/1', site)).toBe(
      'blob:http://localhost:8081/1',
    )
    expect(rewriteMediaUrl('http://localhost:8081/_expo/font.ttf', site)).toBe(
      'http://localhost:8081/_expo/font.ttf',
    )
    const once = rewriteMediaUrl('https://cdn.example.com/bed/x.jpg', site)
    expect(rewriteMediaUrl(once, site)).toBe(once)
  })

  it('does not proxy http images', () => {
    expect(
      rewriteMediaUrl('http://example.com/a.png', 'https://example.com'),
    ).toBe('http://example.com/a.png')
  })
})

describe('rewriteSrcSet', () => {
  it('rewrites each candidate and keeps descriptors', () => {
    const rewritten = rewriteSrcSet(
      'https://cdn.example.com/a.png 1x, https://cdn.example.com/b.png 2x',
      'https://example.com',
    )
    const [first, second] = rewritten.split(',').map((part) => part.trim())
    expect(parseAssetRequest(first.split(/\s+/)[0])?.url).toBe(
      'https://cdn.example.com/a.png',
    )
    expect(first.endsWith(' 1x')).toBe(true)
    expect(parseAssetRequest(second.split(/\s+/)[0])?.url).toBe(
      'https://cdn.example.com/b.png',
    )
    expect(second.endsWith(' 2x')).toBe(true)
  })
})

describe('buildMediaRewriteScript', () => {
  it('bakes the normalized site Referer and asset scheme into the page script', () => {
    const script = buildMediaRewriteScript('https://example.com')
    expect(script).toContain(ASSET_SCHEME)
    expect(script).toContain('https://example.com/')
    expect(script.includes('(function(){')).toBe(true)
  })
})

describe('native asset handler', () => {
  it('registers the asset scheme and does not hardcode a site Referer', () => {
    const handler = readFileSync(
      path.join(packageDir, 'ios/DomAssetSchemeHandler.swift'),
      'utf8',
    )
    const store = readFileSync(
      path.join(packageDir, 'ios/DomImageAssetStore.swift'),
      'utf8',
    )
    expect(handler).toContain(`"${ASSET_SCHEME}"`)
    expect(handler).not.toContain('defaultReferer')
    expect(handler).not.toContain('innei.in')
    expect(store).toContain('Referer')
    expect(store).not.toContain('innei.in')
    expect(store).not.toContain('defaultReferer')
  })
})
