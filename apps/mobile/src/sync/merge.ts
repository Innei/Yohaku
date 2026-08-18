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

export function bodyIsStale(
  row: Versioned & { articleMeta?: unknown; bodyVersion: number | null },
) {
  if (row.bodyVersion === null) return true
  // A null articleMeta means the detail has never been fetched under the
  // notice-card schema — rows carried in by migration 0003 have a fresh body
  // but no meta, and without this they would never refetch to backfill it.
  if (row.articleMeta === null) return true
  if (noticeMetaNeedsBackfill(row.articleMeta)) return true
  if (translatedBodyNeedsRefresh(row.articleMeta)) return true
  return row.bodyVersion < contentVersion(row)
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
    tags: post.tags ?? [],
    // List responses arrive truncated (truncate=160): text is the excerpt
    // source, content is nulled by the server. Never persist them as body.
    excerpt: post.summary ?? post.text ?? null,
    contentFormat: post.contentFormat ?? 'markdown',
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
    contentFormat: post.contentFormat ?? 'markdown',
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
    contentFormat: note.contentFormat ?? 'markdown',
    hasPassword: note.hasPassword ?? false,
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
    contentFormat: note.contentFormat ?? 'markdown',
    bodyVersion: contentVersion(note),
    enrichments,
    articleMeta: extractArticleMeta(meta, note.summary, note.meta?.aiGen),
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
