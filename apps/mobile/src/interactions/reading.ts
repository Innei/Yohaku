import { asc, count, inArray } from 'drizzle-orm'
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core'

import { readingHistory, type ReadingKind } from '@/db/schema'
import type { Locale } from '@/i18n/config'
import { pruneStaleBodies } from '@/sync/keep-set'

export const READING_HISTORY_CAP = 100

export async function recordReading(
  database: BaseSQLiteDatabase<
    'sync' | 'async',
    Record<string, never>,
    Record<string, never>
  >,
  input: { kind: ReadingKind; lang?: Locale; openedAt?: Date; refId: string },
) {
  const openedAt = input.openedAt ?? new Date()
  await database
    .insert(readingHistory)
    .values({ refId: input.refId, kind: input.kind, openedAt })
    .onConflictDoUpdate({
      target: readingHistory.refId,
      set: { kind: input.kind, openedAt },
    })
  const [tally] = await database.select({ total: count() }).from(readingHistory)
  const total = tally?.total ?? 0
  if (total <= READING_HISTORY_CAP) return
  const overflow = total - READING_HISTORY_CAP
  const oldest = await database
    .select({ refId: readingHistory.refId })
    .from(readingHistory)
    .orderBy(asc(readingHistory.openedAt))
    .limit(overflow)
  if (oldest.length === 0) return
  await database.delete(readingHistory).where(
    inArray(
      readingHistory.refId,
      oldest.map((row) => row.refId),
    ),
  )
  if (input.lang) await pruneStaleBodies(database as never, input.lang)
}
