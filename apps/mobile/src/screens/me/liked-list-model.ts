import type { LikedRefRow, NoteRow, PostRow, ThinkingRow } from '@/db/schema'

export type LikedListItem =
  | { kind: 'note'; likedAt: Date; note: NoteRow }
  | { kind: 'post'; likedAt: Date; post: PostRow }
  | { kind: 'thinking'; likedAt: Date; thinking: ThinkingRow }
  | { kind: 'unavailable'; likedAt: Date; refId: string }

export function resolveLikedItems(
  refs: LikedRefRow[],
  posts: PostRow[],
  notes: NoteRow[],
  thinkings: ThinkingRow[],
): LikedListItem[] {
  const postsById = new Map(posts.map((row) => [row.id, row]))
  const notesById = new Map(notes.map((row) => [row.id, row]))
  const thinkingsById = new Map(thinkings.map((row) => [row.id, row]))
  const items: LikedListItem[] = []
  for (const ref of refs) {
    if (ref.kind === 'recently-down') continue
    if (ref.kind === 'post') {
      const post = postsById.get(ref.refId)
      items.push(
        post
          ? { kind: 'post', likedAt: ref.likedAt, post }
          : { kind: 'unavailable', likedAt: ref.likedAt, refId: ref.refId },
      )
      continue
    }
    if (ref.kind === 'note') {
      const note = notesById.get(ref.refId)
      items.push(
        note
          ? { kind: 'note', likedAt: ref.likedAt, note }
          : { kind: 'unavailable', likedAt: ref.likedAt, refId: ref.refId },
      )
      continue
    }
    const thinking = thinkingsById.get(ref.refId)
    items.push(
      thinking
        ? { kind: 'thinking', likedAt: ref.likedAt, thinking }
        : { kind: 'unavailable', likedAt: ref.likedAt, refId: ref.refId },
    )
  }
  return items
}
