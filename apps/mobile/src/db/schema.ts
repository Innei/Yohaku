import {
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'

import type { ArticleNoticeMeta } from '@/api/article-meta'
import type { ApiEnrichment } from '@/api/types'

// posts/notes/categories are keyed by (id, lang): mx-core translates title,
// body, excerpt and even category.name per request language, so the same id
// holds genuinely different content in each locale.
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').notNull(),
    lang: text('lang').notNull(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    categoryId: text('category_id'),
    categorySlug: text('category_slug'),
    categoryName: text('category_name'),
    tags: text('tags', { mode: 'json' })
      .$type<string[]>()
      .notNull()
      .default([]),
    excerpt: text('excerpt'),
    text: text('text'),
    content: text('content'),
    contentFormat: text('content_format'),
    readCount: integer('read_count').notNull().default(0),
    likeCount: integer('like_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    modifiedAt: integer('modified_at', { mode: 'timestamp_ms' }),
    pinAt: integer('pin_at', { mode: 'timestamp_ms' }),
    bodyVersion: integer('body_version'),
    enrichments: text('enrichments', { mode: 'json' }).$type<Record<
      string,
      ApiEnrichment
    > | null>(),
    articleMeta: text('article_meta', {
      mode: 'json',
    }).$type<ArticleNoticeMeta | null>(),
  },
  (table) => [primaryKey({ columns: [table.id, table.lang] })],
)

export const notes = sqliteTable(
  'notes',
  {
    id: text('id').notNull(),
    lang: text('lang').notNull(),
    nid: integer('nid').notNull(),
    title: text('title').notNull(),
    mood: text('mood'),
    weather: text('weather'),
    excerpt: text('excerpt'),
    text: text('text'),
    content: text('content'),
    contentFormat: text('content_format'),
    hasPassword: integer('has_password', { mode: 'boolean' })
      .notNull()
      .default(false),
    readCount: integer('read_count').notNull().default(0),
    likeCount: integer('like_count').notNull().default(0),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    modifiedAt: integer('modified_at', { mode: 'timestamp_ms' }),
    bodyVersion: integer('body_version'),
    enrichments: text('enrichments', { mode: 'json' }).$type<Record<
      string,
      ApiEnrichment
    > | null>(),
    articleMeta: text('article_meta', {
      mode: 'json',
    }).$type<ArticleNoticeMeta | null>(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.lang] }),
    unique('notes_nid_lang_unique').on(table.nid, table.lang),
  ],
)

export const thinkings = sqliteTable('thinkings', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  up: integer('up').notNull().default(0),
  down: integer('down').notNull().default(0),
  commentsIndex: integer('comments_index').notNull().default(0),
  allowComment: integer('allow_comment', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  modifiedAt: integer('modified_at', { mode: 'timestamp_ms' }),
  enrichments: text('enrichments', { mode: 'json' }).$type<Record<
    string,
    ApiEnrichment
  > | null>(),
})

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').notNull(),
    lang: text('lang').notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    type: integer('type').notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.id, table.lang] })],
)

export const syncMeta = sqliteTable('sync_meta', {
  collection: text('collection').primaryKey(),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp_ms' }),
})

export const likedRefs = sqliteTable('liked_refs', {
  refId: text('ref_id').primaryKey(),
  kind: text('kind').$type<LikedKind>().notNull(),
  likedAt: integer('liked_at', { mode: 'timestamp_ms' }).notNull(),
})

export type LikedKind = 'post' | 'note' | 'recently-up' | 'recently-down'
export type ReadingKind = 'post' | 'note'

export const readingHistory = sqliteTable('reading_history', {
  refId: text('ref_id').primaryKey(),
  kind: text('kind').$type<ReadingKind>().notNull(),
  openedAt: integer('opened_at', { mode: 'timestamp_ms' }).notNull(),
})

export type PostRow = typeof posts.$inferSelect
export type NoteRow = typeof notes.$inferSelect
export type ThinkingRow = typeof thinkings.$inferSelect
export type CategoryRow = typeof categories.$inferSelect
export type LikedRefRow = typeof likedRefs.$inferSelect
export type ReadingHistoryRow = typeof readingHistory.$inferSelect
