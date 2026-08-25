import type { Href } from 'expo-router'

import { locales } from '@/i18n/config'
import { getSiteHosts, getSiteUrl } from '@/lib/site-url'

const LOCALE_SEGMENT = new Set<string>(locales)

const POST_PATH = /^\/posts\/([^/]+)\/([^/]+)\/?$/
const POST_CATEGORY_PATH = /^\/posts\/([^/]+)\/?$/
const TAG_PATH = /^\/posts\/tag\/([^/]+)\/?$/
const CATEGORY_PATH = /^\/categories\/([^/]+)\/?$/
const NOTE_PATH = /^\/notes\/(\d+)\/?$/
const NOTE_INDEX_PATH = /^\/notes\/?$/
const NOTE_SEO_PATH = /^\/notes\/(\d{4})\/(\d{1,2})\/(\d{1,2})\/([^/]+)\/?$/
const SERIES_INDEX_PATH = /^\/notes\/series\/?$/
const SERIES_DETAIL_PATH = /^\/notes\/series\/([^/]+)\/?$/
const SCHEME = /^[a-z][\d+.a-z-]*:/i
const PAGE_PATH = /^\/([^/]+)\/?$/
// Web serves standalone pages from the site root, so a single segment is only
// a page when it is not one of the site's own top-level routes.
const RESERVED_ROOT_SEGMENTS = new Set([
  'api',
  'auth',
  'categories',
  'common',
  'dev',
  'feed',
  'friends',
  'login',
  'notes',
  'og',
  'posts',
  'preview',
  'privacy',
  'projects',
  'says',
  'search',
  'sitemap',
  'skills',
  'thinking',
  'timeline',
])

function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function strictDecimalUInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) ? n : null
}

function isValidNoteSlugDateParts(
  year: string,
  month: string,
  day: string,
): boolean {
  const y = strictDecimalUInt(year)
  const m = strictDecimalUInt(month)
  const d = strictDecimalUInt(day)
  if (y === null || m === null || d === null) return false
  if (y < 1000 || y > 9999 || m < 1 || m > 12) return false
  const maxDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return d >= 1 && d <= maxDay
}

function sitePathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] && LOCALE_SEGMENT.has(segments[0])) {
    return `/${segments.slice(1).join('/')}`
  }
  return pathname
}

// `allowPage` is only ever true for links proven to point at the site host:
// a bare `/x` could just as well be one of the app's own routes.
function hrefForSitePath(pathname: string, allowPage = false): Href | null {
  const path = sitePathname(pathname)
  const tag = path.match(TAG_PATH)
  if (tag) {
    return {
      pathname: '/posts/tag/[name]',
      params: { name: decodeParam(tag[1]) },
    }
  }
  const post = path.match(POST_PATH)
  if (post) {
    return {
      pathname: '/posts/[category]/[slug]',
      params: { category: decodeParam(post[1]), slug: decodeParam(post[2]) },
    }
  }
  const postCategory = path.match(POST_CATEGORY_PATH)
  if (postCategory) {
    return {
      pathname: '/categories/[slug]',
      params: { slug: decodeParam(postCategory[1]) },
    }
  }
  const category = path.match(CATEGORY_PATH)
  if (category) {
    return {
      pathname: '/categories/[slug]',
      params: { slug: decodeParam(category[1]) },
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
    return {
      pathname: '/series/[slug]',
      params: { slug: decodeParam(series[1]) },
    }
  }
  if (NOTE_INDEX_PATH.test(path)) {
    return { pathname: '/notes' }
  }
  const seo = path.match(NOTE_SEO_PATH)
  if (seo && isValidNoteSlugDateParts(seo[1], seo[2], seo[3])) {
    return {
      pathname: '/notes/[year]/[month]/[day]/[slug]',
      params: {
        year: String(Number(seo[1])),
        month: String(Number(seo[2])),
        day: String(Number(seo[3])),
        slug: decodeParam(seo[4]),
      },
    }
  }
  const page = allowPage ? path.match(PAGE_PATH) : null
  if (page && !RESERVED_ROOT_SEGMENTS.has(page[1])) {
    return { pathname: '/pages/[slug]', params: { slug: decodeParam(page[1]) } }
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
  return (
    path.startsWith('/posts') ||
    path.startsWith('/notes') ||
    path.startsWith('/categories')
  )
}

export function hrefForExternalUrl(url: string): Href | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (!getSiteHosts().includes(parsed.hostname)) return null
  return hrefForSitePath(parsed.pathname, true)
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
