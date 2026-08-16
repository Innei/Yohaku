import type { NoteRow, PostRow, ReadingHistoryRow } from '@/db/schema'

export type ReadingListItem =
  | { kind: 'note'; note: NoteRow; openedAt: Date }
  | { kind: 'post'; openedAt: Date; post: PostRow }
  | { kind: 'unavailable'; openedAt: Date; refId: string }

export function resolveReadingItems(
  history: ReadingHistoryRow[],
  posts: PostRow[],
  notes: NoteRow[],
): ReadingListItem[] {
  const postsById = new Map(posts.map((row) => [row.id, row]))
  const notesById = new Map(notes.map((row) => [row.id, row]))
  return history.map((row) => {
    if (row.kind === 'post') {
      const post = postsById.get(row.refId)
      return post
        ? { kind: 'post', openedAt: row.openedAt, post }
        : { kind: 'unavailable', openedAt: row.openedAt, refId: row.refId }
    }
    const note = notesById.get(row.refId)
    return note
      ? { kind: 'note', openedAt: row.openedAt, note }
      : { kind: 'unavailable', openedAt: row.openedAt, refId: row.refId }
  })
}
