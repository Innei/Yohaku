import type { Href } from 'expo-router'

import { locales } from '@/i18n/config'
import { getSiteHosts, getSiteUrl } from '@/lib/site-url'

const LOCALE_SEGMENT = new Set<string>(locales)

const POST_PATH = /^\/posts\/([^/]+)\/([^/]+)\/?$/
const NOTE_PATH = /^\/notes\/(\d+)\/?$/
const SERIES_INDEX_PATH = /^\/notes\/series\/?$/
const SERIES_DETAIL_PATH = /^\/notes\/series\/([^/]+)\/?$/
const SCHEME = /^[a-z][\d+.a-z-]*:/i

function sitePathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] && LOCALE_SEGMENT.has(segments[0])) {
    return `/${segments.slice(1).join('/')}`
  }
  return pathname
}

function hrefForSitePath(pathname: string): Href | null {
  const path = sitePathname(pathname)
  const post = path.match(POST_PATH)
  if (post) {
    return {
      pathname: '/posts/[category]/[slug]',
      params: { category: post[1], slug: post[2] },
    }
  }
  const note = path.match(NOTE_PATH)
  if (note) {
    return { pathname: '/notes/[nid]', params: { nid: note[1] } }
  }
  if (SERIES_INDEX_PATH.test(path)) {
    return { pathname: '/series' }
  }
  const series = path.match(SERIES_DETAIL_PATH)
  if (series) {
    return { pathname: '/series/[slug]', params: { slug: series[1] } }
  }
  return null
}

function pathFromHref(href: Href | null): string | null {
  if (!href || typeof href === 'string' || !('pathname' in href)) return null
  const params =
    'params' in href && href.params && typeof href.params === 'object'
      ? (href.params as Record<string, unknown>)
      : {}
  let path: string = href.pathname
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    path = path.replaceAll(`[${key}]`, encodeURIComponent(String(value)))
  }
  return path
}

function isClaimedPath(pathname: string): boolean {
  const path = sitePathname(pathname)
  return path.startsWith('/posts') || path.startsWith('/notes')
}

export function hrefForExternalUrl(url: string): Href | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!getSiteHosts().includes(parsed.hostname)) return null
  return hrefForSitePath(parsed.pathname)
}

export function pathForExternalUrl(url: string): string | null {
  return pathFromHref(hrefForExternalUrl(url))
}

function isCustomScheme(path: string): boolean {
  return SCHEME.test(path) && !/^https?:/i.test(path)
}

export function rewriteIncomingPath(path: string): string {
  if (isCustomScheme(path)) return path
  if (path.startsWith('/') && !SCHEME.test(path)) {
    const mapped = pathFromHref(hrefForSitePath(path))
    if (mapped) return mapped
    if (isClaimedPath(path)) return '/'
    return path
  }
  const mapped = pathForExternalUrl(path)
  if (mapped) return mapped
  try {
    const parsed = new URL(path)
    if (
      getSiteHosts().includes(parsed.hostname) &&
      isClaimedPath(parsed.pathname)
    ) {
      return '/'
    }
  } catch {
    const base = getSiteUrl()
    if (base) {
      const absolute = `${base}${path.startsWith('/') ? path : `/${path}`}`
      const fromBase = pathForExternalUrl(absolute)
      if (fromBase) return fromBase
    }
  }
  return path.startsWith('/') ? path : `/${path}`
}
