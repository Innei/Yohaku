import { and, desc, eq } from 'drizzle-orm'

import { db } from '@/db'
import { type NoteRow, notes, type TopicRow, topics } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import type { Locale } from '@/i18n/config'

export interface TopicDetailSnapshot {
  notes: NoteRow[]
  topic: TopicRow | undefined
}

interface TopicDetailSnapshotOptions {
  locale: Locale
  slug: string
  topicId?: string
}

async function readNotes(topicId: string, locale: Locale) {
  return db
    .select()
    .from(notes)
    .where(and(eq(notes.topicId, topicId), eq(notes.lang, locale)))
    .orderBy(desc(notes.createdAt))
}

async function readTopicDetailSnapshot({
  locale,
  slug,
  topicId,
}: TopicDetailSnapshotOptions): Promise<TopicDetailSnapshot> {
  if (topicId) {
    const [topicRows, noteRows] = await Promise.all([
      db.select().from(topics).where(eq(topics.id, topicId)).limit(1),
      readNotes(topicId, locale),
    ])
    const topic = topicRows[0]
    return { notes: topic ? noteRows : [], topic }
  }

  // Universal links only contain the public slug. Resolve it without exposing
  // an intermediate topic-only render, then commit one complete snapshot.
  const topicRows = await db
    .select()
    .from(topics)
    .where(eq(topics.slug, slug))
    .limit(1)
  const topic = topicRows[0]
  return {
    notes: topic ? await readNotes(topic.id, locale) : [],
    topic,
  }
}

export function useTopicDetailSnapshot(options: TopicDetailSnapshotOptions) {
  const { locale, slug, topicId } = options
  const routeIdentity = `${locale}:${topicId ?? ''}:${slug}`
  return useDatabaseSnapshot({
    identity: routeIdentity,
    read: () => readTopicDetailSnapshot({ locale, slug, topicId }),
    tables: ['notes', 'topics'],
  })
}
