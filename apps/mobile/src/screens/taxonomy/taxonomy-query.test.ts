import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { and, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import { posts } from '@/db/schema'

import { tagJsonContains } from './taxonomy-sql'

const migrationsDir = path.resolve(import.meta.dirname, '../../../drizzle')

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

const base = {
  id: 'p1',
  lang: 'zh',
  slug: 'hello',
  title: '标题',
  categoryId: 'c1',
  categorySlug: 'coding',
  categoryName: '编程',
  excerpt: null,
  contentFormat: 'markdown',
  readCount: 0,
  likeCount: 0,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  modifiedAt: null,
  pinAt: null,
}

describe('tagJsonContains', () => {
  it('matches an exact JSON tag and ignores siblings', async () => {
    await db.insert(posts).values([
      { ...base, id: 'hit', tags: ['react', 'ios'] },
      { ...base, id: 'miss', slug: 'other', tags: ['vue'] },
      {
        ...base,
        id: 'en',
        lang: 'en',
        slug: 'en-hit',
        tags: ['react'],
      },
    ])

    const rows = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.lang, 'zh'), tagJsonContains('react')))

    expect(rows.map((row) => row.id)).toEqual(['hit'])
  })
})
