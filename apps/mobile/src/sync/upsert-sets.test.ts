import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { and, eq, gte, notInArray } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import { categories, notes, posts } from '@/db/schema'

import { pruneBoundary } from './merge'
import {
  categoryConflictSet,
  noteConflictSet,
  postConflictSet,
} from './upsert-sets'

const migrationsDir = path.resolve(import.meta.dirname, '../../drizzle')

function createDb() {
  const sqlite = new Database(':memory:')
  for (const file of readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()) {
    const content = readFileSync(path.join(migrationsDir, file), 'utf8')
    for (const statement of content.split('--> statement-breakpoint')) {
      sqlite.exec(statement)
    }
  }
  return drizzle(sqlite)
}

let db: ReturnType<typeof createDb>

beforeEach(() => {
  db = createDb()
})

const postMeta = {
  id: 'p1',
  lang: 'zh',
  slug: 'hello',
  title: '初版标题',
  categoryId: 'c1',
  categorySlug: 'programming',
  categoryName: '编程',
  tags: ['a'],
  excerpt: '摘要',
  contentFormat: 'markdown',
  readCount: 10,
  likeCount: 3,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  modifiedAt: null,
  pinAt: null,
}

describe('postConflictSet', () => {
  it('updates metadata without clobbering a cached body', async () => {
    await db.insert(posts).values(postMeta)
    await db
      .update(posts)
      .set({
        text: '完整正文',
        content: '{"root":{}}',
        bodyVersion: postMeta.createdAt.getTime(),
      })
      .where(and(eq(posts.id, 'p1'), eq(posts.lang, 'zh')))

    await db
      .insert(posts)
      .values({
        ...postMeta,
        title: '更新后的标题',
        contentFormat: 'lexical',
        likeCount: 9,
        modifiedAt: new Date('2026-08-06T00:00:00.000Z'),
      })
      .onConflictDoUpdate({
        target: [posts.id, posts.lang],
        set: postConflictSet,
      })

    const [row] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, 'p1'), eq(posts.lang, 'zh')))
    expect(row.title).toBe('更新后的标题')
    expect(row.likeCount).toBe(9)
    expect(row.modifiedAt).toEqual(new Date('2026-08-06T00:00:00.000Z'))
    expect(row.contentFormat).toBe('lexical')
    expect(row.text).toBe('完整正文')
    expect(row.content).toBe('{"root":{}}')
    expect(row.bodyVersion).toBe(postMeta.createdAt.getTime())
  })

  it('keeps one row per language for the same post id', async () => {
    await db.insert(posts).values(postMeta)
    await db
      .insert(posts)
      .values({ ...postMeta, lang: 'en', title: 'First title' })
      .onConflictDoUpdate({
        target: [posts.id, posts.lang],
        set: postConflictSet,
      })

    const rows = await db.select().from(posts).where(eq(posts.id, 'p1'))
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.title).sort()).toEqual([
      'First title',
      '初版标题',
    ])
  })
})

describe('noteConflictSet', () => {
  const noteMeta = {
    id: 'n1',
    lang: 'zh',
    nid: 42,
    title: '手记',
    mood: '开心',
    weather: '晴',
    excerpt: '概要',
    contentFormat: 'markdown',
    hasPassword: false,
    readCount: 1,
    likeCount: 0,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    modifiedAt: null,
  }

  it('updates metadata without clobbering a cached body', async () => {
    await db.insert(notes).values(noteMeta)
    await db
      .update(notes)
      .set({ text: '正文', bodyVersion: noteMeta.createdAt.getTime() })
      .where(and(eq(notes.id, 'n1'), eq(notes.lang, 'zh')))

    await db
      .insert(notes)
      .values({ ...noteMeta, mood: '平静', contentFormat: 'lexical' })
      .onConflictDoUpdate({
        target: [notes.id, notes.lang],
        set: noteConflictSet,
      })

    const [row] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, 'n1'), eq(notes.lang, 'zh')))
    expect(row.mood).toBe('平静')
    expect(row.contentFormat).toBe('lexical')
    expect(row.text).toBe('正文')
    expect(row.bodyVersion).toBe(noteMeta.createdAt.getTime())
    expect(row.topicId).toBeNull()
  })

  it('writes topicId from a later list sync', async () => {
    await db.insert(notes).values(noteMeta)
    await db
      .insert(notes)
      .values({ ...noteMeta, topicId: 't1' })
      .onConflictDoUpdate({
        target: [notes.id, notes.lang],
        set: noteConflictSet,
      })
    const [row] = await db
      .select()
      .from(notes)
      .where(and(eq(notes.id, 'n1'), eq(notes.lang, 'zh')))
    expect(row.topicId).toBe('t1')
  })

  it('admits the same nid under a second language', async () => {
    await db.insert(notes).values(noteMeta)
    await db.insert(notes).values({ ...noteMeta, lang: 'ja', title: '手記' })

    const rows = await db.select().from(notes).where(eq(notes.nid, 42))
    expect(rows).toHaveLength(2)
  })
})

describe('categoryConflictSet', () => {
  const zhRows = [
    { id: 'c1', lang: 'zh', name: '编程', slug: 'programming', type: 0 },
    { id: 'c2', lang: 'zh', name: '生活', slug: 'life', type: 0 },
  ]

  it('supports full-replace sync with deletion of vanished rows', async () => {
    await db.insert(categories).values(zhRows)

    const remote = [
      {
        id: 'c1',
        lang: 'zh',
        name: '编程与思考',
        slug: 'programming',
        type: 0,
      },
    ]
    await db
      .insert(categories)
      .values(remote)
      .onConflictDoUpdate({
        target: [categories.id, categories.lang],
        set: categoryConflictSet,
      })
    await db.delete(categories).where(
      and(
        eq(categories.lang, 'zh'),
        notInArray(
          categories.id,
          remote.map((item) => item.id),
        ),
      ),
    )

    const rows = await db.select().from(categories)
    expect(rows).toHaveLength(1)
    expect(rows[0].name).toBe('编程与思考')
  })

  it('leaves other languages untouched when pruning', async () => {
    await db.insert(categories).values([
      ...zhRows,
      {
        id: 'c1',
        lang: 'en',
        name: 'Programming',
        slug: 'programming',
        type: 0,
      },
      { id: 'c2', lang: 'en', name: 'Life', slug: 'life', type: 0 },
    ])

    // Syncing English down to a single category must not touch the Chinese
    // rows — an unscoped prune here wipes every other locale's cache.
    const remote = [{ id: 'c1', lang: 'en' }]
    await db.delete(categories).where(
      and(
        eq(categories.lang, 'en'),
        notInArray(
          categories.id,
          remote.map((item) => item.id),
        ),
      ),
    )

    const zhRemaining = await db
      .select()
      .from(categories)
      .where(eq(categories.lang, 'zh'))
    const enRemaining = await db
      .select()
      .from(categories)
      .where(eq(categories.lang, 'en'))
    expect(zhRemaining).toHaveLength(2)
    expect(enRemaining).toHaveLength(1)
  })
})

describe('taxonomy ingest upsert', () => {
  it('updates matching posts without deleting other categories', async () => {
    await db.insert(posts).values([
      postMeta,
      {
        ...postMeta,
        id: 'p2',
        slug: 'other',
        categoryId: 'c2',
        categorySlug: 'life',
        categoryName: '生活',
        tags: ['b'],
      },
    ])

    await db
      .insert(posts)
      .values({
        ...postMeta,
        title: '分类页补齐后的标题',
        likeCount: 12,
      })
      .onConflictDoUpdate({
        target: [posts.id, posts.lang],
        set: postConflictSet,
      })

    const rows = await db.select().from(posts)
    expect(rows).toHaveLength(2)
    expect(rows.find((row) => row.id === 'p1')?.title).toBe(
      '分类页补齐后的标题',
    )
    expect(rows.find((row) => row.id === 'p2')?.categorySlug).toBe('life')
  })
})

describe('post sync window pruning', () => {
  const at = (iso: string) => new Date(iso)
  const row = (
    id: string,
    iso: string,
    extra: { lang?: string; pinAt?: Date | null } = {},
  ) => ({ ...postMeta, id, slug: id, createdAt: at(iso), ...extra })

  async function prune(list: { createdAt: Date; id: string }[]) {
    const boundary = pruneBoundary(list)
    if (boundary === null) return
    await db.delete(posts).where(
      and(
        eq(posts.lang, 'zh'),
        gte(posts.createdAt, new Date(boundary)),
        notInArray(
          posts.id,
          list.map((item) => item.id),
        ),
      ),
    )
  }

  it('drops rows that vanished inside the fetched window', async () => {
    await db
      .insert(posts)
      .values([
        row('fresh', '2026-08-01T00:00:00.000Z'),
        row('deleted-upstream', '2026-07-01T00:00:00.000Z'),
        row('older-page', '2026-01-01T00:00:00.000Z'),
      ])

    await prune([
      { id: 'fresh', createdAt: at('2026-08-01T00:00:00.000Z') },
      { id: 'kept', createdAt: at('2026-06-01T00:00:00.000Z') },
    ])

    const ids = (await db.select().from(posts)).map((r) => r.id).sort()
    // 'older-page' predates the window and must survive: this sync only ever
    // requested page 1, so its absence there carries no information.
    expect(ids).toEqual(['fresh', 'older-page'])
  })

  it('never widens the window past a pinned entry', async () => {
    await db.insert(posts).values([
      row('pinned-old', '2020-01-01T00:00:00.000Z', {
        pinAt: at('2026-03-25T00:00:00.000Z'),
      }),
      row('recent', '2026-08-01T00:00:00.000Z'),
      row('archive', '2021-01-01T00:00:00.000Z'),
    ])

    await prune([
      {
        id: 'pinned-old',
        createdAt: at('2020-01-01T00:00:00.000Z'),
        pinAt: at('2026-03-25T00:00:00.000Z'),
      },
      { id: 'recent', createdAt: at('2026-08-01T00:00:00.000Z') },
    ] as { createdAt: Date; id: string }[])

    const ids = (await db.select().from(posts)).map((r) => r.id).sort()
    expect(ids).toEqual(['archive', 'pinned-old', 'recent'])
  })

  it('leaves other languages alone', async () => {
    await db
      .insert(posts)
      .values([
        row('gone', '2026-07-01T00:00:00.000Z'),
        { ...row('gone', '2026-07-01T00:00:00.000Z'), lang: 'en' },
      ])

    await prune([{ id: 'other', createdAt: at('2026-06-01T00:00:00.000Z') }])

    const rows = await db.select().from(posts)
    expect(rows.map((r) => `${r.id}:${r.lang}`)).toEqual(['gone:en'])
  })
})
