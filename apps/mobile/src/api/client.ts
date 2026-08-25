import { fetch } from 'expo/fetch'

import { getSessionCookie } from '@/auth/client'
import { setSession } from '@/auth/session-store'
import { getLocale } from '@/i18n/locale-store'
import type { CommentAnchor } from '@/lib/comment-anchor'
import { readerCommentBody } from '@/lib/comment-anchor'

import { apiBaseUrl } from './base-url'
import { camelize } from './camelize'
import { camelizeEnrichments } from './enrichments'
import { ApiError, extractServerMessage } from './errors'
import type {
  MembershipPlansResult,
  MembershipStatusResult,
} from './membership'
import { readPresenceMap } from './presence-map'
import { parseThinkingList } from './thinking'
import type {
  ApiAggregate,
  ApiCategory,
  ApiCategoryDetail,
  ApiComment,
  ApiCommentRoot,
  ApiCommentThreadPage,
  ApiEnrichment,
  ApiMyComment,
  ApiNote,
  ApiPage,
  ApiPaged,
  ApiPagination,
  ApiPost,
  ApiPushActivation,
  ApiSearchNote,
  ApiSearchPost,
  ApiSessionUser,
  ApiSiteInfo,
  ApiTagDetail,
  ApiTopic,
  ApiTts,
  CommentRefType,
} from './types'

export { ApiError }

const REQUEST_TIMEOUT_MS = 15_000

type QueryParams = Record<string, string | number | boolean | undefined>

function buildQuery(params?: QueryParams): string {
  if (!params) return ''
  const pairs = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
  return pairs.length > 0 ? `?${pairs.join('&')}` : ''
}

// mx-core resolves the content language from query.lang ahead of the x-lang
// header, which is how the blanked accept-language above (a workaround for a
// 500 on /notes/nid/:nid) stays compatible with i18n. Only content endpoints
// get it — auth routes have no localized payload.
function withLang(params?: QueryParams): QueryParams {
  return { ...params, lang: getLocale() }
}

interface RequestInitLite {
  body?: unknown
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
}

async function fetchRawJson(
  path: string,
  params?: QueryParams,
  init?: RequestInitLite,
): Promise<unknown> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    const cookie = getSessionCookie()
    const hasBody = init?.body !== undefined
    const res = await fetch(`${apiBaseUrl()}${path}${buildQuery(params)}`, {
      method: init?.method ?? 'GET',
      headers: {
        accept: 'application/json',
        // mx-core 500s on GET /notes/nid/:nid whenever a non-empty
        // Accept-Language reaches it; blank out fetch's auto header until the
        // server-side language negotiation is fixed.
        'accept-language': '',
        'user-agent': 'Yohaku-Mobile/1.0 (iOS)',
        ...(hasBody ? { 'content-type': 'application/json' } : null),
        ...(cookie ? { cookie } : null),
      },
      body: hasBody ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      if (res.status === 401) setSession(null)
      const detail = await res.text().catch(() => '')
      throw new ApiError(
        res.status,
        `HTTP ${res.status} ${path} ${detail.slice(0, 200)}`,
        extractServerMessage(detail),
      )
    }
    const text = await res.text()
    return text ? JSON.parse(text) : null
  } finally {
    clearTimeout(timer)
  }
}

async function request<T>(
  path: string,
  params?: QueryParams,
  init?: RequestInitLite,
): Promise<T> {
  // Raw mx-core REST serializes snake_case; the web app gets camelCase only
  // because @mx-space/api-client transforms keys client-side.
  const json = camelize<unknown>(await fetchRawJson(path, params, init))
  // mx-core wraps meta-bearing responses in a { data, meta } envelope.
  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data
  }
  return json as T
}

export interface DetailEnvelope<T> {
  data: T
  enrichments: Record<string, ApiEnrichment> | null
  meta: unknown
}

async function requestDetail<T>(
  path: string,
  lang = getLocale(),
): Promise<DetailEnvelope<T>> {
  const raw = (await fetchRawJson(path, { lang })) as {
    data?: unknown
    meta?: { enrichments?: Record<string, unknown> }
  }
  if (!raw || typeof raw !== 'object' || !('data' in raw)) {
    return { data: camelize<T>(raw), enrichments: null, meta: null }
  }
  const { enrichments: rawEnrichments, ...restMeta } = raw.meta ?? {}
  return {
    data: camelize<T>(raw.data),
    enrichments: camelizeEnrichments(rawEnrichments),
    meta: camelize<unknown>(restMeta),
  }
}

interface PagedEnvelope<T> {
  data?: T[] | PagedEnvelope<T>
  meta?: { pagination?: ApiPagination }
}

async function requestPaged<T>(
  path: string,
  params?: QueryParams,
): Promise<ApiPaged<T>> {
  let envelope = camelize<PagedEnvelope<T>>(await fetchRawJson(path, params))
  // Some routes (comments) double-wrap: { data: { data: [...], meta } }.
  while (envelope?.data && !Array.isArray(envelope.data)) {
    envelope = envelope.data
  }
  const data = Array.isArray(envelope?.data) ? envelope.data : []
  return {
    data,
    pagination: envelope?.meta?.pagination ?? {
      page: 1,
      size: data.length,
      total: data.length,
      totalPages: 1,
    },
  }
}

export const api = {
  postList: (page: number, size: number, lang = getLocale()) =>
    requestPaged<ApiPost>('/posts', { page, size, truncate: 160, lang }),
  postDetail: (categorySlug: string, slug: string, lang = getLocale()) =>
    requestDetail<ApiPost>(
      `/posts/${encodeURIComponent(categorySlug)}/${encodeURIComponent(slug)}`,
      lang,
    ),
  // ponytail: mx-core's GET /pages has no truncate option, so every row drags
  // its full body along (~100KB). Swap to a summary endpoint if it grows.
  pageList: (lang = getLocale()) =>
    requestPaged<ApiPage>('/pages', { page: 1, size: 30, lang }),
  pageDetail: (slug: string, lang = getLocale()) =>
    requestDetail<ApiPage>(`/pages/slug/${encodeURIComponent(slug)}`, lang),
  noteList: (page: number, size: number, lang = getLocale()) =>
    requestPaged<ApiNote>('/notes', { page, size, withSummary: 1, lang }),
  noteDetail: (nid: number, lang = getLocale()) =>
    requestDetail<ApiNote>(`/notes/nid/${nid}`, lang),
  noteBySlugDate: (
    year: number,
    month: number,
    day: number,
    slug: string,
    lang = getLocale(),
  ) =>
    requestDetail<ApiNote>(
      `/notes/${year}/${month}/${day}/${encodeURIComponent(slug)}`,
      lang,
    ),
  archiveTimeline: (
    scope: 'notes' | 'posts',
    lang = getLocale(),
  ) =>
    request<{ notes?: ApiNote[]; posts?: ApiPost[] }>(
      '/aggregate/timeline',
      {
        lang,
        sort: -1,
        type: scope === 'posts' ? 0 : 1,
      },
    ),
  thinkingList: async (size: number) =>
    parseThinkingList(await fetchRawJson('/recently', { size })),
  categoryList: () =>
    request<ApiCategory[]>('/categories', withLang({ type: 0 })),
  searchPosts: (keyword: string, lang = getLocale()) =>
    requestPaged<ApiSearchPost>('/search/post', {
      keyword,
      lang,
      page: 1,
      size: 20,
    }),
  searchNotes: (keyword: string, lang = getLocale()) =>
    requestPaged<ApiSearchNote>('/search/note', {
      keyword,
      lang,
      page: 1,
      size: 20,
    }),
  categoryBySlug: (slug: string) =>
    request<ApiCategoryDetail>(
      `/categories/${encodeURIComponent(slug)}`,
      withLang(),
    ),
  tagByName: (name: string) =>
    request<ApiTagDetail>(`/categories/${encodeURIComponent(name)}`, {
      ...withLang({ tag: true }),
    }),
  topicList: () => request<ApiTopic[]>('/topics/all', withLang()),
  topicById: (topicId: string) =>
    request<ApiTopic>(`/topics/${encodeURIComponent(topicId)}`, withLang()),
  topicBySlug: (slug: string) =>
    request<ApiTopic>(`/topics/slug/${encodeURIComponent(slug)}`, withLang()),
  topicNotes: (
    topicId: string,
    page: number,
    size: number,
    lang = getLocale(),
  ) =>
    requestPaged<ApiNote>(`/notes/topics/${encodeURIComponent(topicId)}`, {
      lang,
      page,
      size,
      sortBy: 'createdAt',
      sortOrder: -1,
    }),
  aggregate: () => request<ApiAggregate>('/aggregate'),
  siteInfo: () => request<ApiSiteInfo>('/aggregate/site_info'),
  skillMarkdown: async (name: string) => {
    const res = await fetch(
      `${apiBaseUrl()}/s/sk/${encodeURIComponent(name)}/SKILL.md`,
      { headers: { accept: 'text/markdown, text/plain, */*' } },
    )
    if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status} skill`)
    return res.text()
  },
  authProviders: () => request<string[]>('/auth/providers'),
  authSession: () => request<ApiSessionUser | null>('/auth/session'),
  commentList: (refId: string, page: number, size = 10) =>
    requestPaged<ApiCommentRoot>(`/comments/ref/${encodeURIComponent(refId)}`, {
      page,
      size,
    }),
  myComments: (page: number, size = 20) =>
    requestPaged<ApiMyComment>('/comments/reader/me', { page, size }),
  commentThread: (rootId: string, cursor?: string) =>
    request<ApiCommentThreadPage>(
      `/comments/thread/${encodeURIComponent(rootId)}`,
      { cursor },
    ),
  readerComment: (
    refId: string,
    ref: CommentRefType,
    text: string,
    anchor?: CommentAnchor | null,
  ) =>
    request<ApiComment>(
      `/comments/reader/${encodeURIComponent(refId)}`,
      { ref },
      { method: 'POST', body: readerCommentBody(text, anchor) },
    ),
  readerReply: (parentId: string, text: string) =>
    request<ApiComment>(
      `/comments/reader/reply/${encodeURIComponent(parentId)}`,
      undefined,
      { method: 'POST', body: { text } },
    ),
  editComment: (id: string, text: string) =>
    request<unknown>(`/comments/edit/${encodeURIComponent(id)}`, undefined, {
      method: 'PATCH',
      body: { text },
    }),
  likeContent: (type: 'post' | 'note', id: string) =>
    request<unknown>('/activity/like', undefined, {
      method: 'POST',
      body: { id, type },
    }),
  reportComment: (id: string) =>
    request<unknown>(`/comments/${encodeURIComponent(id)}/report`, undefined, {
      method: 'POST',
    }),
  insights: (articleId: string) =>
    request<{ content: string | null }>(
      `/ai/insights/article/${encodeURIComponent(articleId)}`,
      withLang({ onlyDb: true }),
    ),
  articleTts: (articleId: string) =>
    request<ApiTts | null>(
      `/ai/tts/article/${encodeURIComponent(articleId)}`,
      withLang(),
    ),
  recentlyAttitude: (id: string, attitude: 0 | 1) =>
    request<{ code: number }>(
      `/recently/attitude/${encodeURIComponent(id)}`,
      { attitude },
      { method: 'POST' },
    ),
  updatePresence: (body: {
    displayName?: string
    identity: string
    position: number
    readerId?: string
    roomName: string
    sid: string
    ts: number
  }) =>
    request<unknown>('/activity/presence/update', undefined, {
      method: 'POST',
      body,
    }),
  // Raw fetch: the presence map is keyed by visitor identity, and request()'s
  // blanket camelize would mangle those keys (the server bypasses its own
  // case transform for the same reason). The envelope still has to be unwrapped.
  getRoomPresence: async (roomName: string) =>
    readPresenceMap(
      await fetchRawJson('/activity/presence', {
        room_name: roomName,
      }),
    ),
  getLiveDeskPublicState: () =>
    request<{ state: unknown } | null>('/companion/presence/public'),
  pushActivate: (body: { activationTicket: string; relayUrl: string }) =>
    request<ApiPushActivation>('/notifications/push/activate', undefined, {
      method: 'POST',
      body,
    }),
  membershipPlans: () => request<MembershipPlansResult>('/membership/plans'),
  membershipStatus: () => request<MembershipStatusResult>('/membership/status'),
  membershipAppleAccountToken: () =>
    request<{ accountToken: string }>('/membership/apple/account-token'),
  membershipConfirmApple: (signedTransactionInfo: string) =>
    request<MembershipStatusResult>('/membership/apple/confirm', undefined, {
      method: 'POST',
      body: { signedTransactionInfo },
    }),
}
