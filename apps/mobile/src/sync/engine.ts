import { and, desc, eq, gte, inArray, notInArray } from 'drizzle-orm'

import {
  ARTICLE_BODY_BATCH_LIMIT,
  type ArticleBodyLine,
  type ArticleBodyRequestItem,
} from '@/api/article-body'
import { apiBaseUrl } from '@/api/base-url'
import { api } from '@/api/client'
import type { ApiCategory, ApiNote, ApiPost, ApiTopic } from '@/api/types'
import { db } from '@/db'
import type { NoteRow, PostRow } from '@/db/schema'
import {
  categories,
  notes,
  posts,
  syncMeta,
  thinkings,
  topics,
} from '@/db/schema'
import type { Locale } from '@/i18n/config'
import { getLocale } from '@/i18n/locale-store'
import { prefetchImages } from '@/lib/image-cache'
import { getSiteUrl } from '@/lib/site-url'
import { noteListPageSize } from '@/screens/lists/note-timeline'
import { postListPageSize } from '@/screens/lists/post-list'

import { extractImageUrls } from './image-urls'
import { BODY_PREFETCH_COUNT, pruneStaleBodies } from './keep-set'
import {
  bodyIsStale,
  calibrateNoteMeta,
  calibratePostMeta,
  listBodyPatchFromLine,
  noteBodyFromApi,
  noteMetaFromApi,
  postBodyFromApi,
  postMetaFromApi,
  pruneBoundary,
  thinkingFromApi,
  topicFromApi,
} from './merge'
import { setSyncStatus } from './status'
import {
  categoryConflictSet,
  noteConflictSet,
  postConflictSet,
  thinkingConflictSet,
  topicConflictSet,
} from './upsert-sets'

const LIST_PAGE_SIZE = 20
const SYNC_THROTTLE_MS = 60_000
const SYNC_META_KEY = 'all'

let inflight: Promise<void> | null = null
const bodyRefreshInflight = new Map<string, Promise<void>>()

function runBodyRefresh(key: string, operation: () => Promise<void>) {
  const current = bodyRefreshInflight.get(key)
  if (current) return current

  const pending = operation().finally(() => {
    if (bodyRefreshInflight.get(key) === pending) {
      bodyRefreshInflight.delete(key)
    }
  })
  bodyRefreshInflight.set(key, pending)
  return pending
}

export function syncAll(options: { force?: boolean } = {}): Promise<void> {
  if (inflight && options.force) {
    // A forced sync (language switch) must not collapse into a run that was
    // started under the previous locale.
    return inflight.catch(() => {}).then(() => syncAll(options))
  }
  inflight ??= run(options).finally(() => {
    inflight = null
  })
  return inflight
}

export async function resetAndResync() {
  if (inflight) await inflight.catch(() => {})
  await Promise.all([
    db.delete(posts),
    db.delete(notes),
    db.delete(thinkings),
    db.delete(topics),
    db.delete(categories),
    db.delete(syncMeta),
  ])
  await syncAll({ force: true })
}

async function run({ force }: { force?: boolean }) {
  if (!apiBaseUrl()) {
    setSyncStatus('idle')
    return
  }
  if (!force && !(await isDue())) return
  setSyncStatus('syncing')
  const results = await Promise.allSettled([
    syncCategories(),
    syncTopics(),
    syncPosts(),
    syncNotes(),
    syncThinkings(),
  ])
  const failed = results.some((result) => result.status === 'rejected')
  await prefetchBodies().catch(() => {})
  await pruneStaleBodies(db, getLocale()).catch(() => {})
  if (!failed) await markSynced()
  setSyncStatus(failed ? 'error' : 'idle')
}

async function isDue(): Promise<boolean> {
  const [row] = await db
    .select()
    .from(syncMeta)
    .where(eq(syncMeta.collection, SYNC_META_KEY))
  if (!row?.lastSyncAt) return true
  return Date.now() - row.lastSyncAt.getTime() > SYNC_THROTTLE_MS
}

async function markSynced() {
  const now = new Date()
  await db
    .insert(syncMeta)
    .values({ collection: SYNC_META_KEY, lastSyncAt: now })
    .onConflictDoUpdate({
      target: syncMeta.collection,
      set: { lastSyncAt: now },
    })
}

async function syncCategories() {
  const lang = getLocale()
  const list = await api.categoryList()
  if (list.length === 0) return
  await db
    .insert(categories)
    .values(
      list.map(({ id, name, slug, type }) => ({ id, lang, name, slug, type })),
    )
    .onConflictDoUpdate({
      target: [categories.id, categories.lang],
      set: categoryConflictSet,
    })
  // Scoped to the current language: an unscoped prune would wipe every other
  // locale's cached categories on the first sync after a language switch.
  await db.delete(categories).where(
    and(
      eq(categories.lang, lang),
      notInArray(
        categories.id,
        list.map((item) => item.id),
      ),
    ),
  )
}

async function upsertPostMetas(list: ApiPost[], lang: Locale) {
  if (list.length === 0) return
  const incoming = list.map((post) => postMetaFromApi(post, lang))
  const existing = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.lang, lang),
        inArray(
          posts.id,
          incoming.map((post) => post.id),
        ),
      ),
    )
  const byId = new Map(existing.map((row) => [row.id, row]))
  await db
    .insert(posts)
    .values(incoming.map((meta) => calibratePostMeta(byId.get(meta.id), meta)))
    .onConflictDoUpdate({
      target: [posts.id, posts.lang],
      set: postConflictSet,
    })
}

function attachParentCategory(post: ApiPost, category: ApiCategory): ApiPost {
  return {
    ...post,
    category: post.category ?? category,
    categoryId: post.categoryId ?? category.id,
  }
}

export async function ingestCategoryBySlug(slug: string, lang = getLocale()) {
  const detail = await api.categoryBySlug(slug)
  await db
    .insert(categories)
    .values({
      id: detail.id,
      lang,
      name: detail.name,
      slug: detail.slug,
      type: detail.type ?? 0,
    })
    .onConflictDoUpdate({
      target: [categories.id, categories.lang],
      set: categoryConflictSet,
    })
  await upsertPostMetas(
    (detail.children ?? []).map((post) => attachParentCategory(post, detail)),
    lang,
  )
  return detail
}

export async function ingestTagByName(name: string, lang = getLocale()) {
  const result = await api.tagByName(name)
  await upsertPostMetas(result.data ?? [], lang)
  return result
}

async function syncPosts() {
  const lang = getLocale()
  const { data: list } = await api.postList(1, postListPageSize, lang)
  await upsertPostMetas(list, lang)
  // Only the fetched window is prunable — rows older than it live on pages
  // this sync never requested, so their absence here says nothing.
  const boundary = pruneBoundary(list)
  if (boundary === null) return
  await db.delete(posts).where(
    and(
      eq(posts.lang, lang),
      gte(posts.createdAt, new Date(boundary)),
      notInArray(
        posts.id,
        list.map((post) => post.id),
      ),
    ),
  )
}

export async function ingestPostPage(page: number, lang = getLocale()) {
  const paged = await api.postList(page, postListPageSize, lang)
  await upsertPostMetas(paged.data, lang)
  return paged
}

async function upsertTopics(list: ApiTopic[], lang: Locale) {
  if (list.length === 0) return
  await db
    .insert(topics)
    .values(list.map((topic) => topicFromApi(topic, lang)))
    .onConflictDoUpdate({
      target: [topics.id, topics.lang],
      set: topicConflictSet,
    })
}

async function syncTopics() {
  const lang = getLocale()
  const list = await api.topicList()
  if (!Array.isArray(list) || list.length === 0) return
  await upsertTopics(list, lang)
  await db.delete(topics).where(
    and(
      eq(topics.lang, lang),
      notInArray(
        topics.id,
        list.map((item) => item.id),
      ),
    ),
  )
}

async function upsertNoteMetas(list: ApiNote[], lang: Locale) {
  if (list.length === 0) return
  await upsertTopics(
    list.flatMap((note) => (note.topic ? [note.topic] : [])),
    lang,
  )
  const incoming = list.map((note) => noteMetaFromApi(note, lang))
  const existing = await db
    .select()
    .from(notes)
    .where(
      and(
        eq(notes.lang, lang),
        inArray(
          notes.id,
          incoming.map((note) => note.id),
        ),
      ),
    )
  const byId = new Map(existing.map((row) => [row.id, row]))
  await db
    .insert(notes)
    .values(incoming.map((meta) => calibrateNoteMeta(byId.get(meta.id), meta)))
    .onConflictDoUpdate({
      target: [notes.id, notes.lang],
      set: noteConflictSet,
    })
}

async function syncNotes() {
  const lang = getLocale()
  const { data: list } = await api.noteList(1, noteListPageSize, lang)
  await upsertNoteMetas(list, lang)
  const boundary = pruneBoundary(list)
  if (boundary === null) return
  await db.delete(notes).where(
    and(
      eq(notes.lang, lang),
      gte(notes.createdAt, new Date(boundary)),
      notInArray(
        notes.id,
        list.map((note) => note.id),
      ),
    ),
  )
}

export async function ingestNotePage(page: number, lang = getLocale()) {
  const paged = await api.noteList(page, noteListPageSize, lang)
  await upsertNoteMetas(paged.data, lang)
  return paged
}

export async function ingestArticleBodies(
  items: ArticleBodyRequestItem[],
  lang = getLocale(),
) {
  if (items.length === 0) return
  for (let offset = 0; offset < items.length; offset += ARTICLE_BODY_BATCH_LIMIT) {
    const chunk = items.slice(offset, offset + ARTICLE_BODY_BATCH_LIMIT)
    await api.articleBodies(chunk, {
      lang,
      onLine: (line) => applyArticleBodyLine(line, lang),
    })
  }
}

async function applyArticleBodyLine(line: ArticleBodyLine, lang: Locale) {
  const patch = listBodyPatchFromLine(line)
  if (patch.kind === 'skip') return

  if (line.kind === 'post') {
    if (patch.kind !== 'body') return
    await db
      .update(posts)
      .set({
        text: patch.text,
        content: patch.content,
        contentFormat: patch.contentFormat,
        ...(typeof patch.bodyVersion === 'number'
          ? { bodyVersion: patch.bodyVersion }
          : {}),
      })
      .where(and(eq(posts.id, line.id), eq(posts.lang, lang)))
    return
  }

  if (patch.kind === 'password') {
    await db
      .update(notes)
      .set({ hasPassword: true })
      .where(and(eq(notes.id, line.id), eq(notes.lang, lang)))
    return
  }

  await db
    .update(notes)
    .set({
      text: patch.text,
      content: patch.content,
      contentFormat: patch.contentFormat,
      ...(typeof patch.bodyVersion === 'number'
        ? { bodyVersion: patch.bodyVersion }
        : {}),
    })
    .where(and(eq(notes.id, line.id), eq(notes.lang, lang)))
}

export async function ingestTopicPage(
  topicId: string,
  page: number,
  lang = getLocale(),
) {
  const paged = await api.topicNotes(topicId, page, noteListPageSize, lang)
  await upsertNoteMetas(paged.data, lang)
  return paged
}

export async function refreshTopicById(topicId: string, lang = getLocale()) {
  const topic = await api.topicById(topicId)
  await upsertTopics([topic], lang)
  return topic
}

export async function refreshTopicBySlug(slug: string, lang = getLocale()) {
  const topic = await api.topicBySlug(slug)
  await upsertTopics([topic], lang)
  return topic
}

async function syncThinkings() {
  const list = await api.thinkingList(LIST_PAGE_SIZE)
  if (list.length === 0) return
  await db
    .insert(thinkings)
    .values(list.map(thinkingFromApi))
    .onConflictDoUpdate({ target: thinkings.id, set: thinkingConflictSet })
}

export async function refreshPostBody(
  row: Pick<PostRow, 'categorySlug' | 'id' | 'lang' | 'slug'>,
) {
  const categorySlug = row.categorySlug
  if (!categorySlug) return
  const lang = getLocale()
  // The detail request is answered in the current language; writing it into a
  // row cached under a different one would mix locales inside a single row.
  if (row.lang !== lang) return
  return runBodyRefresh(`post:${row.id}:${lang}`, async () => {
    const {
      data: detail,
      enrichments,
      meta,
    } = await api.postDetail(categorySlug, row.slug, lang)
    await db
      .update(posts)
      .set({
        ...calibratePostMeta(undefined, postMetaFromApi(detail, lang)),
        ...postBodyFromApi(detail, enrichments, meta),
      })
      .where(and(eq(posts.id, row.id), eq(posts.lang, row.lang)))
  })
}

export async function refreshNoteBody(
  row: Pick<NoteRow, 'id' | 'lang' | 'nid'>,
) {
  const lang = getLocale()
  if (row.lang !== lang) return
  return runBodyRefresh(`note:${row.id}:${lang}`, async () => {
    const {
      data: detail,
      enrichments,
      meta,
    } = await api.noteDetail(row.nid, lang)
    await db
      .update(notes)
      .set({
        ...calibrateNoteMeta(undefined, noteMetaFromApi(detail, lang)),
        ...noteBodyFromApi(detail, enrichments, meta),
      })
      .where(and(eq(notes.id, row.id), eq(notes.lang, row.lang)))
  })
}

async function prefetchBodies() {
  const lang = getLocale()
  const [recentPosts, recentNotes] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.lang, lang))
      .orderBy(desc(posts.createdAt))
      .limit(BODY_PREFETCH_COUNT),
    db
      .select()
      .from(notes)
      .where(eq(notes.lang, lang))
      .orderBy(desc(notes.createdAt))
      .limit(BODY_PREFETCH_COUNT),
  ])

  const stalePosts = recentPosts.filter(
    (row) =>
      bodyIsStale(row) &&
      Boolean(row.categorySlug) &&
      row.contentFormat !== 'markdown',
  )
  const staleNotes = recentNotes.filter(
    (row) =>
      bodyIsStale(row) &&
      !row.hasPassword &&
      row.contentFormat !== 'markdown',
  )
  await ingestArticleBodies(
    [
      ...stalePosts.map((row) => ({
        id: row.id,
        kind: 'post' as const,
        ...(typeof row.bodyVersion === 'number'
          ? { bodyVersion: row.bodyVersion }
          : {}),
      })),
      ...staleNotes.map((row) => ({
        id: row.id,
        kind: 'note' as const,
        ...(typeof row.bodyVersion === 'number'
          ? { bodyVersion: row.bodyVersion }
          : {}),
      })),
    ],
    lang,
  ).catch(() => {})

  const [freshPosts, freshNotes] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.lang, lang))
      .orderBy(desc(posts.createdAt))
      .limit(BODY_PREFETCH_COUNT),
    db
      .select()
      .from(notes)
      .where(eq(notes.lang, lang))
      .orderBy(desc(notes.createdAt))
      .limit(BODY_PREFETCH_COUNT),
  ])
  const urls = [
    ...freshPosts.flatMap((row) =>
      extractImageUrls({
        content: row.content,
        enrichments: row.enrichments,
        text: row.text,
      }),
    ),
    ...freshNotes.flatMap((row) =>
      extractImageUrls({
        content: row.content,
        enrichments: row.enrichments,
        text: row.text,
      }),
    ),
  ]
  await prefetchImages([...new Set(urls)], getSiteUrl()).catch(() => {})
}
