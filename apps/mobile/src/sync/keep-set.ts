import { and, desc, eq, isNotNull, not, notInArray } from 'drizzle-orm'

import type { db } from '@/db'
import { likedRefs, notes, posts, readingHistory } from '@/db/schema'
import type { Locale } from '@/i18n/config'

export const BODY_PREFETCH_COUNT = 20

const clearedBody = {
  articleMeta: null,
  bodyVersion: null,
  content: null,
  enrichments: null,
  text: null,
}

export async function pruneStaleBodies(database: typeof db, lang: Locale) {
  const [recentPosts, recentNotes, history, liked] = await Promise.all([
    database
      .select({ id: posts.id })
      .from(posts)
      .where(eq(posts.lang, lang))
      .orderBy(desc(posts.createdAt))
      .limit(BODY_PREFETCH_COUNT),
    database
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.lang, lang))
      .orderBy(desc(notes.createdAt))
      .limit(BODY_PREFETCH_COUNT),
    database.select().from(readingHistory),
    database.select().from(likedRefs),
  ])

  const keepPostIds = [
    ...new Set([
      ...recentPosts.map((row) => row.id),
      ...history.filter((row) => row.kind === 'post').map((row) => row.refId),
      ...liked.filter((row) => row.kind === 'post').map((row) => row.refId),
    ]),
  ]
  const keepNoteIds = [
    ...new Set([
      ...recentNotes.map((row) => row.id),
      ...history.filter((row) => row.kind === 'note').map((row) => row.refId),
      ...liked.filter((row) => row.kind === 'note').map((row) => row.refId),
    ]),
  ]

  await Promise.all([
    clearCurrentLocale(database, posts, posts.id, lang, keepPostIds),
    clearCurrentLocale(database, notes, notes.id, lang, keepNoteIds),
    database
      .update(posts)
      .set(clearedBody)
      .where(and(not(eq(posts.lang, lang)), isNotNull(posts.bodyVersion))),
    database
      .update(notes)
      .set(clearedBody)
      .where(and(not(eq(notes.lang, lang)), isNotNull(notes.bodyVersion))),
  ])
}

async function clearCurrentLocale(
  database: typeof db,
  table: typeof posts | typeof notes,
  idColumn: typeof posts.id | typeof notes.id,
  lang: Locale,
  keepIds: string[],
) {
  const scoped = and(eq(table.lang, lang), isNotNull(table.bodyVersion))
  if (keepIds.length === 0) {
    await database.update(table).set(clearedBody).where(scoped)
    return
  }
  await database
    .update(table)
    .set(clearedBody)
    .where(and(scoped, notInArray(idColumn, keepIds)))
}
