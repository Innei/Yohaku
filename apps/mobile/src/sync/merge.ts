import type { ArticleBodyLine } from '@/api/article-body'
import { isArticleBodyPayload } from '@/api/article-body'
import {
  extractArticleMeta,
  noticeMetaNeedsBackfill,
  translatedBodyNeedsRefresh,
} from '@/api/article-meta'
import type {
  ApiEnrichment,
  ApiNote,
  ApiPost,
  ApiThinking,
  ApiTopic,
} from '@/api/types'
import type { NoteRow, PostRow } from '@/db/schema'
import type { Locale } from '@/i18n/config'

type EnrichmentMap = Record<string, ApiEnrichment> | null

interface Versioned {
  createdAt: string | Date
  modifiedAt: string | Date | null
}

function toMs(value: string | Date): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

// modifiedAt is nullable server-side (never-edited entries), so the content
// version is max(createdAt, modifiedAt) — never modifiedAt alone.
export function contentVersion(item: Versioned): number {
  const created = toMs(item.createdAt)
  const modified = item.modifiedAt ? toMs(item.modifiedAt) : 0
  return Math.max(created, modified)
}

/**
 * Oldest createdAt covered by a list response, used as the lower bound of the
 * window a sync is allowed to prune. Pinned entries are excluded on purpose:
 * the server hoists them to the top of page 1 regardless of age, so letting
 * one set the bound would stretch the window across the whole archive while
 * the response still only covers a single page — and everything below it
 * would be deleted as "vanished upstream".
 *
 * Returns null when every returned entry is pinned; there is no safe window
 * to prune then.
 */
export function pruneBoundary(
  items: { createdAt: string | Date; pinAt?: string | Date | null }[],
): number | null {
  const unpinned = items.filter((item) => !item.pinAt)
  if (unpinned.length === 0) return null
  return Math.min(...unpinned.map((item) => toMs(item.createdAt)))
}

export function bodyIsStale(row: Versioned & { bodyVersion: number | null }) {
  if (row.bodyVersion === null) return true
  return row.bodyVersion < contentVersion(row)
}

export function needsListBody(row: {
  bodyVersion: number | null
  contentFormat?: string | null
  createdAt: Date | string
  hasPassword?: boolean | null
  modifiedAt: Date | string | null
}) {
  if (row.contentFormat === 'markdown') return false
  if (row.hasPassword) return false
  return bodyIsStale(row)
}

export function decorationIsStale(row: { articleMeta?: unknown }) {
  if (row.articleMeta === null || row.articleMeta === undefined) return true
  if (noticeMetaNeedsBackfill(row.articleMeta)) return true
  if (translatedBodyNeedsRefresh(row.articleMeta)) return true
  return false
}

export type ListBodyPatch =
  | { kind: 'skip' }
  | { kind: 'password' }
  | {
      kind: 'body'
      bodyVersion: number | null
      content: string
      contentFormat: string
      text: string
    }

export function listBodyPatchFromLine(line: ArticleBodyLine): ListBodyPatch {
  if ('missing' in line || 'unchanged' in line) return { kind: 'skip' }
  if ('hasPassword' in line) return { kind: 'password' }
  if (!isArticleBodyPayload(line) || !line.content) return { kind: 'skip' }
  return {
    kind: 'body',
    bodyVersion: line.locked ? null : contentVersion(line),
    content: line.content,
    contentFormat: line.contentFormat,
    text: line.text,
  }
}

export function postMetaFromApi(post: ApiPost, lang: Locale) {
  return {
    id: post.id,
    lang,
    slug: post.slug,
    title: post.title,
    categoryId: post.categoryId ?? post.category?.id ?? null,
    categorySlug: post.category?.slug ?? null,
    categoryName: post.category?.name ?? null,
    tags: post.tags ?? null,
    // List responses arrive truncated (truncate=160): text is the excerpt
    // source, content is nulled by the server. Never persist them as body.
    excerpt: post.summary ?? post.text ?? null,
    contentFormat: post.contentFormat ?? null,
    readCount: post.readCount,
    likeCount: post.likeCount,
    createdAt: new Date(post.createdAt),
    modifiedAt: post.modifiedAt ? new Date(post.modifiedAt) : null,
    pinAt: post.pinAt ? new Date(post.pinAt) : null,
  }
}

export function postBodyFromApi(
  post: ApiPost,
  enrichments: EnrichmentMap,
  meta?: unknown,
) {
  return {
    text: post.text ?? null,
    content: post.content ?? null,
    contentFormat: post.contentFormat ?? null,
    bodyVersion: contentVersion(post),
    enrichments,
    articleMeta: extractArticleMeta(meta, post.summary, post.meta?.aiGen),
  }
}

export function noteMetaFromApi(note: ApiNote, lang: Locale) {
  return {
    id: note.id,
    lang,
    nid: note.nid,
    title: note.title,
    mood: note.mood ?? null,
    weather: note.weather ?? null,
    excerpt: note.summary ?? null,
    contentFormat: note.contentFormat ?? null,
    hasPassword: note.hasPassword ?? null,
    topicId: note.topicId ?? note.topic?.id ?? null,
    readCount: note.readCount,
    likeCount: note.likeCount,
    createdAt: new Date(note.createdAt),
    modifiedAt: note.modifiedAt ? new Date(note.modifiedAt) : null,
  }
}

export function noteBodyFromApi(
  note: ApiNote,
  enrichments: EnrichmentMap,
  meta?: unknown,
) {
  return {
    text: note.text ?? null,
    content: note.content ?? null,
    contentFormat: note.contentFormat ?? null,
    bodyVersion: contentVersion(note),
    enrichments,
    articleMeta: extractArticleMeta(meta, note.summary, note.meta?.aiGen),
  }
}

type PostMeta = ReturnType<typeof postMetaFromApi>
type NoteMeta = ReturnType<typeof noteMetaFromApi>

export function calibratePostMeta(
  existing: PostRow | undefined,
  incoming: PostMeta,
) {
  if (!existing) {
    return {
      ...incoming,
      tags: incoming.tags ?? [],
      readCount: incoming.readCount ?? 0,
      likeCount: incoming.likeCount ?? 0,
      text: null,
      content: null,
      bodyVersion: null,
      enrichments: null,
      articleMeta: null,
    }
  }
  return {
    ...existing,
    ...incoming,
    categoryId: incoming.categoryId ?? existing.categoryId,
    categorySlug: incoming.categorySlug ?? existing.categorySlug,
    categoryName: incoming.categoryName ?? existing.categoryName,
    tags: incoming.tags ?? existing.tags,
    excerpt: incoming.excerpt ?? existing.excerpt,
    contentFormat: incoming.contentFormat ?? existing.contentFormat,
    readCount: incoming.readCount ?? existing.readCount,
    likeCount: incoming.likeCount ?? existing.likeCount,
    text: existing.text,
    content: existing.content,
    bodyVersion: existing.bodyVersion,
    enrichments: existing.enrichments,
    articleMeta: existing.articleMeta,
  }
}

export function calibrateNoteMeta(
  existing: NoteRow | undefined,
  incoming: NoteMeta,
) {
  if (!existing) {
    return {
      ...incoming,
      hasPassword: incoming.hasPassword ?? false,
      readCount: incoming.readCount ?? 0,
      likeCount: incoming.likeCount ?? 0,
      text: null,
      content: null,
      bodyVersion: null,
      enrichments: null,
      articleMeta: null,
    }
  }
  return {
    ...existing,
    ...incoming,
    mood: incoming.mood ?? existing.mood,
    weather: incoming.weather ?? existing.weather,
    excerpt: incoming.excerpt ?? existing.excerpt,
    contentFormat: incoming.contentFormat ?? existing.contentFormat,
    hasPassword: incoming.hasPassword ?? existing.hasPassword,
    topicId: incoming.topicId ?? existing.topicId,
    readCount: incoming.readCount ?? existing.readCount,
    likeCount: incoming.likeCount ?? existing.likeCount,
    text: existing.text,
    content: existing.content,
    bodyVersion: existing.bodyVersion,
    enrichments: existing.enrichments,
    articleMeta: existing.articleMeta,
  }
}

export function topicFromApi(topic: ApiTopic) {
  return {
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    description: topic.description ?? '',
    introduce: topic.introduce ?? null,
    icon: topic.icon ?? null,
    createdAt: new Date(topic.createdAt),
  }
}

export function thinkingFromApi(item: ApiThinking) {
  return {
    id: item.id,
    content: item.content,
    up: item.up,
    down: item.down,
    commentsIndex: item.commentsIndex ?? 0,
    allowComment: item.allowComment ?? true,
    createdAt: new Date(item.createdAt),
    modifiedAt: item.modifiedAt ? new Date(item.modifiedAt) : null,
    enrichments:
      item.enrichments && Object.keys(item.enrichments).length > 0
        ? item.enrichments
        : null,
  }
}
