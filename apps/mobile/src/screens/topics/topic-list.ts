import type { TopicRow } from '@/db/schema'

export function topicById(
  items: TopicRow[],
  id: string | null | undefined,
): TopicRow | null {
  if (!id) return null
  return items.find((item) => item.id === id) ?? null
}

export function formatTopicNoteDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

export function sortTopicsByCreated<T extends { createdAt: Date }>(
  items: T[],
): T[] {
  return [...items].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )
}
