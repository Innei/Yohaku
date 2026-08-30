export const NOTE_LIST_RULE_ID = '__older'
export const NOTE_LIST_FOOTER_ID = '__footer'

export const noteListEstimatedHeight = {
  footer: 48,
  latest: 420,
  note: 120,
  rule: 56,
  year: 88,
} as const

export type FlattenedNoteListItem = {
  estimatedHeight: number
  id: string
  type: 'footer' | 'latest' | 'note' | 'rule' | 'year'
}

export function noteYearItemId(year: number): string {
  return `__year-${year}`
}

export function yearFromNoteItemId(id: string): number {
  return Number(id.slice('__year-'.length))
}

export function flattenNotesList({
  groups,
  latestId,
  loadingMore,
}: {
  groups: { notes: { id: string }[]; year: number }[]
  latestId: string | null
  loadingMore: boolean
}): FlattenedNoteListItem[] {
  const items: FlattenedNoteListItem[] = []
  if (latestId) {
    items.push({
      id: latestId,
      type: 'latest',
      estimatedHeight: noteListEstimatedHeight.latest,
    })
  }
  if (groups.length > 0) {
    items.push({
      id: NOTE_LIST_RULE_ID,
      type: 'rule',
      estimatedHeight: noteListEstimatedHeight.rule,
    })
  }
  for (const group of groups) {
    items.push({
      id: noteYearItemId(group.year),
      type: 'year',
      estimatedHeight: noteListEstimatedHeight.year,
    })
    for (const note of group.notes) {
      items.push({
        id: note.id,
        type: 'note',
        estimatedHeight: noteListEstimatedHeight.note,
      })
    }
  }
  if (loadingMore) {
    items.push({
      id: NOTE_LIST_FOOTER_ID,
      type: 'footer',
      estimatedHeight: noteListEstimatedHeight.footer,
    })
  }
  return items
}
