import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import Database from 'better-sqlite3'
import { desc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { beforeEach, describe, expect, it } from 'vitest'

import { readingHistory } from '@/db/schema'

import { READING_HISTORY_CAP, recordReading } from './reading'

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

describe('recordReading', () => {
  let db: ReturnType<typeof createDb>
  beforeEach(() => {
    db = createDb()
  })

  it('upserts the same article and keeps one row', async () => {
    const first = new Date('2026-08-01T00:00:00.000Z')
    const second = new Date('2026-08-02T00:00:00.000Z')
    await recordReading(db, { refId: 'p1', kind: 'post', openedAt: first })
    await recordReading(db, { refId: 'p1', kind: 'post', openedAt: second })
    const rows = await db.select().from(readingHistory)
    expect(rows).toHaveLength(1)
    expect(rows[0]?.openedAt).toEqual(second)
  })

  it('drops the oldest rows past READING_HISTORY_CAP', async () => {
    for (let i = 0; i < READING_HISTORY_CAP + 3; i += 1) {
      await recordReading(db, {
        refId: `p${i}`,
        kind: 'post',
        openedAt: new Date(1_700_000_000_000 + i * 1000),
      })
    }
    const rows = await db
      .select()
      .from(readingHistory)
      .orderBy(desc(readingHistory.openedAt))
    expect(rows).toHaveLength(READING_HISTORY_CAP)
    expect(rows.at(-1)?.refId).toBe('p3')
  })
})
