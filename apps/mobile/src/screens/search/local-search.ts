import type { NoteRow, PostRow, ThinkingRow } from '@/db/schema'

export type SearchScope = 'posts' | 'notes' | 'thinking'

export type SearchHit = {
  categoryName?: string | null
  categorySlug?: string | null
  createdAt: Date
  hasPassword?: boolean
  id: string
  isFallback?: boolean
  keywords: string[]
  mood?: string | null
  nid?: number
  slug?: string
  snippet: string | null
  title: string | null
  weather?: string | null
}

const SCOPES: readonly SearchScope[] = ['posts', 'notes', 'thinking']
const SNIPPET_BEFORE = 32
const SNIPPET_AFTER = 48

export function parseSearchScope(value: unknown): SearchScope {
  const raw = Array.isArray(value) ? value[0] : value
  return SCOPES.includes(raw as SearchScope) ? (raw as SearchScope) : 'posts'
}

export function foldSearch(value: string): string {
  return value.toLocaleLowerCase()
}

function includesQuery(haystack: string | null | undefined, query: string) {
  if (!haystack) return false
  return foldSearch(haystack).includes(query)
}

export function clipSnippet(text: string, query: string): string | null {
  const index = foldSearch(text).indexOf(query)
  if (index < 0) return null
  const start = Math.max(0, index - SNIPPET_BEFORE)
  const end = Math.min(text.length, index + query.length + SNIPPET_AFTER)
  return text.slice(start, end)
}

function preparedQuery(keyword: string) {
  return foldSearch(keyword).trim()
}

function keywordsFor(query: string) {
  return [query]
}

type Band = 0 | 1 | 2

function rankHits(hits: Array<SearchHit & { band: Band }>) {
  return hits
    .sort((a, b) => {
      if (a.band !== b.band) return a.band - b.band
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
    .map(({ band: _band, ...hit }) => hit)
}

export function searchPosts(rows: PostRow[], keyword: string): SearchHit[] {
  const query = preparedQuery(keyword)
  if (!query) return []
  const keywords = keywordsFor(query)
  const hits: Array<SearchHit & { band: Band }> = []
  for (const row of rows) {
    const titleHit = includesQuery(row.title, query)
    const metaHit =
      includesQuery(row.excerpt, query) ||
      includesQuery(row.categoryName, query) ||
      row.tags.some((tag) => includesQuery(tag, query))
    const bodyHit = includesQuery(row.text, query)
    if (!titleHit && !metaHit && !bodyHit) continue
    const snippetSource = includesQuery(row.excerpt, query)
      ? row.excerpt
      : includesQuery(row.text, query)
        ? row.text
        : null
    hits.push({
      band: titleHit ? 0 : metaHit ? 1 : 2,
      categoryName: row.categoryName,
      categorySlug: row.categorySlug,
      createdAt: row.createdAt,
      id: row.id,
      keywords,
      slug: row.slug,
      snippet: snippetSource ? clipSnippet(snippetSource, query) : null,
      title: row.title,
    })
  }
  return rankHits(hits)
}

export function searchNotes(rows: NoteRow[], keyword: string): SearchHit[] {
  const query = preparedQuery(keyword)
  if (!query) return []
  const keywords = keywordsFor(query)
  const hits: Array<SearchHit & { band: Band }> = []
  for (const row of rows) {
    const titleHit = includesQuery(row.title, query)
    if (row.hasPassword) {
      if (!titleHit) continue
      hits.push({
        band: 0,
        createdAt: row.createdAt,
        hasPassword: true,
        id: row.id,
        keywords,
        mood: row.mood,
        nid: row.nid,
        snippet: null,
        title: row.title,
        weather: row.weather,
      })
      continue
    }
    const metaHit =
      includesQuery(row.excerpt, query) ||
      includesQuery(row.mood, query) ||
      includesQuery(row.weather, query)
    const bodyHit = includesQuery(row.text, query)
    if (!titleHit && !metaHit && !bodyHit) continue
    const snippetSource = includesQuery(row.excerpt, query)
      ? row.excerpt
      : includesQuery(row.text, query)
        ? row.text
        : null
    hits.push({
      band: titleHit ? 0 : metaHit ? 1 : 2,
      createdAt: row.createdAt,
      hasPassword: false,
      id: row.id,
      keywords,
      mood: row.mood,
      nid: row.nid,
      snippet: snippetSource ? clipSnippet(snippetSource, query) : null,
      title: row.title,
      weather: row.weather,
    })
  }
  return rankHits(hits)
}

export function searchThinkings(
  rows: ThinkingRow[],
  keyword: string,
): SearchHit[] {
  const query = preparedQuery(keyword)
  if (!query) return []
  const keywords = keywordsFor(query)
  const hits: Array<SearchHit & { band: Band }> = []
  for (const row of rows) {
    if (!includesQuery(row.content, query)) continue
    hits.push({
      band: 2,
      createdAt: row.createdAt,
      id: row.id,
      keywords,
      snippet: clipSnippet(row.content, query),
      title: null,
    })
  }
  return rankHits(hits)
}

function escapeRegExp(input: string) {
  return input.replaceAll(/[$()*+.?[\\\]^{|}]/g, '\\$&')
}

export function highlightSegments(text: string, keywords: string[]) {
  const normalized = [...new Set(keywords.filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  )
  if (!text || normalized.length === 0) {
    return [{ highlighted: false, key: `plain-0`, text }]
  }
  const regex = new RegExp(`(${normalized.map(escapeRegExp).join('|')})`, 'gi')
  const keywordSet = new Set(normalized.map((keyword) => foldSearch(keyword)))
  let cursor = 0
  return text
    .split(regex)
    .filter(Boolean)
    .map((segment) => {
      const start = cursor
      cursor += segment.length
      return {
        highlighted: keywordSet.has(foldSearch(segment)),
        key: `${start}-${segment}`,
        text: segment,
      }
    })
}
