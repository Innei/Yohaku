import type { SearchScope } from './local-search'

export type RecentsMap = Record<SearchScope, string[]>

export const EMPTY_RECENTS: RecentsMap = {
  notes: [],
  posts: [],
  thinking: [],
}

const CAP = 10

function normalizeKeyword(keyword: string) {
  return keyword.trim()
}

export function rememberRecent(
  state: RecentsMap,
  scope: SearchScope,
  keyword: string,
): RecentsMap {
  const query = normalizeKeyword(keyword)
  if (!query) return state
  const next = [
    query,
    ...state[scope].filter((item) => item !== query),
  ].slice(0, CAP)
  return { ...state, [scope]: next }
}

export function forgetRecent(
  state: RecentsMap,
  scope: SearchScope,
  keyword: string,
): RecentsMap {
  const query = normalizeKeyword(keyword)
  return {
    ...state,
    [scope]: state[scope].filter((item) => item !== query),
  }
}

export function clearRecents(state: RecentsMap, scope: SearchScope): RecentsMap {
  return { ...state, [scope]: [] }
}

function isScopeList(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  )
}

export function parseRecents(raw: string | null): RecentsMap {
  if (!raw) return EMPTY_RECENTS
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return EMPTY_RECENTS
    const record = parsed as Record<string, unknown>
    if (
      !isScopeList(record.posts) ||
      !isScopeList(record.notes) ||
      !isScopeList(record.thinking)
    ) {
      return EMPTY_RECENTS
    }
    return {
      notes: record.notes.slice(0, CAP),
      posts: record.posts.slice(0, CAP),
      thinking: record.thinking.slice(0, CAP),
    }
  } catch {
    return EMPTY_RECENTS
  }
}

export function serializeRecents(state: RecentsMap): string {
  return JSON.stringify(state)
}
