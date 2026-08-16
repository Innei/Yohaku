import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import { likedRefs, notes, posts, readingHistory } from '@/db/schema'

import { BODY_PREFETCH_COUNT, pruneStaleBodies } from './keep-set'

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

function postValues(
  id: string,
  createdAt: Date,
  extras: { body?: boolean; lang?: string } = {},
) {
  return {
    id,
    lang: extras.lang ?? 'zh',
    slug: id,
    title: id,
    categoryId: null,
    categorySlug: 'blog',
    categoryName: 'Blog',
    tags: [] as string[],
    excerpt: 'excerpt',
    text: extras.body ? `text-${id}` : null,
    content: extras.body ? `{"id":"${id}"}` : null,
    contentFormat: 'lexical',
    readCount: 0,
    likeCount: 0,
    createdAt,
    modifiedAt: null,
    pinAt: null,
    bodyVersion: extras.body ? createdAt.getTime() : null,
    enrichments: null,
    articleMeta: null,
  }
}

function noteValues(
  id: string,
  nid: number,
  createdAt: Date,
  extras: { body?: boolean; lang?: string } = {},
) {
  return {
    id,
    lang: extras.lang ?? 'zh',
    nid,
    title: id,
    mood: null,
    weather: null,
    excerpt: 'excerpt',
    text: extras.body ? `text-${id}` : null,
    content: extras.body ? `{"id":"${id}"}` : null,
    contentFormat: 'lexical',
    hasPassword: false,
    readCount: 0,
    likeCount: 0,
    createdAt,
    modifiedAt: null,
    bodyVersion: extras.body ? createdAt.getTime() : null,
    enrichments: null,
    articleMeta: null,
  }
}

describe('pruneStaleBodies', () => {
  let db: ReturnType<typeof createDb>

  beforeEach(() => {
    db = createDb()
  })

  it('keeps the prefetch window, reading history, and liked bodies', async () => {
    const base = Date.parse('2026-08-01T00:00:00.000Z')
    const rows = Array.from({ length: BODY_PREFETCH_COUNT + 2 }, (_, index) =>
      postValues(`p${index}`, new Date(base + index * 1000), { body: true }),
    )
    await db.insert(posts).values(rows)
    const noteRows = [
      ...Array.from({ length: BODY_PREFETCH_COUNT }, (_, index) =>
        noteValues(
          `n${index}`,
          index + 10,
          new Date(base + 10_000 + index * 1000),
          { body: true },
        ),
      ),
      noteValues('keep-history', 1, new Date(base), { body: true }),
      noteValues('keep-liked', 2, new Date(base + 1), { body: true }),
      noteValues('drop-note', 3, new Date(base + 2), { body: true }),
    ]
    await db.insert(notes).values(noteRows)
    await db.insert(readingHistory).values({
      refId: 'keep-history',
      kind: 'note',
      openedAt: new Date(base + 50_000),
    })
    await db.insert(likedRefs).values({
      refId: 'keep-liked',
      kind: 'note',
      likedAt: new Date(base + 50_000),
    })

    await pruneStaleBodies(db as never, 'zh')

    const keptPosts = await db
      .select({ id: posts.id, bodyVersion: posts.bodyVersion })
      .from(posts)
    const dropped = keptPosts.filter((row) => row.bodyVersion === null)
    expect(dropped.map((row) => row.id).sort()).toEqual(['p0', 'p1'])
    expect(keptPosts.filter((row) => row.bodyVersion !== null)).toHaveLength(
      BODY_PREFETCH_COUNT,
    )

    const [history] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, 'keep-history'))
    const [liked] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, 'keep-liked'))
    const [droppedNote] = await db
      .select()
      .from(notes)
      .where(eq(notes.id, 'drop-note'))
    expect(history?.bodyVersion).not.toBeNull()
    expect(liked?.bodyVersion).not.toBeNull()
    expect(droppedNote?.bodyVersion).toBeNull()
    expect(droppedNote?.excerpt).toBe('excerpt')
  })

  it('clears bodies in other locales and leaves their list meta', async () => {
    await db.insert(posts).values([
      postValues('p1', new Date('2026-08-01T00:00:00.000Z'), { body: true }),
      postValues('p1', new Date('2026-08-01T00:00:00.000Z'), {
        body: true,
        lang: 'en',
      }),
    ])

    await pruneStaleBodies(db as never, 'zh')

    const [zh] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, 'p1'), eq(posts.lang, 'zh')))
    const [en] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, 'p1'), eq(posts.lang, 'en')))
    expect(zh?.bodyVersion).not.toBeNull()
    expect(en?.bodyVersion).toBeNull()
    expect(en?.title).toBe('p1')
    expect(en?.excerpt).toBe('excerpt')
  })
})
