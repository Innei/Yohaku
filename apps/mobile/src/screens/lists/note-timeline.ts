export const noteListPageSize = 20

export function nextNoteListPage(
  loadedCount: number,
  fetchedPage: number,
  pageSize = noteListPageSize,
): number {
  const inferred = Math.max(1, Math.floor(loadedCount / pageSize))
  return Math.max(inferred, fetchedPage) + 1
}

export function hasMoreNotes(
  loadedCount: number,
  total: number | null,
  pageSize = noteListPageSize,
): boolean {
  if (total !== null) return loadedCount < total
  return loadedCount >= pageSize
}

export function groupNotesByYear<T extends { createdAt: Date }>(
  notes: T[],
): { notes: T[]; year: number }[] {
  const groups: { notes: T[]; year: number }[] = []
  for (const note of notes) {
    const year = note.createdAt.getFullYear()
    const last = groups.at(-1)
    if (last?.year === year) last.notes.push(note)
    else groups.push({ notes: [note], year })
  }
  return groups
}

export function letterCountLabel(count: number): string {
  return count === 1 ? '1 letter' : `${count} letters`
}

export function splitLatestNote<T>(
  notes: T[],
): { latest: T; older: T[] } | { latest: null; older: T[] } {
  const latest = notes[0]
  if (!latest) return { latest: null, older: notes }
  return { latest, older: notes.slice(1) }
}

export function noteShowsInlineBody(note: {
  content: string | null
  contentFormat: string | null
  hasPassword: boolean
}): boolean {
  return (
    !note.hasPassword &&
    note.contentFormat === 'lexical' &&
    Boolean(note.content)
  )
}

export function notePreviewIsClipped(contentHeight: number, cap: number) {
  // overflow:hidden can report the child's layout height as the cap instead of
  // the unclipped content height. Treat "at least the cap" as clipped so the
  // fade still attaches on iOS 26.
  return cap > 0 && contentHeight >= cap
}
