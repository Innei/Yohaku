export const TOPIC_CHROME_ID = '__chrome'
export const TOPIC_EMPTY_ID = '__empty'
export const TOPIC_FOOTER_ID = '__footer'

export const topicListEstimatedHeight = {
  chrome: 140,
  empty: 64,
  footer: 48,
  note: 44,
  year: 88,
} as const

export type FlattenedTopicListItem = {
  estimatedHeight: number
  id: string
  type: 'chrome' | 'empty' | 'footer' | 'note' | 'year'
}

export function topicYearItemId(year: number): string {
  return `__year-${year}`
}

export function yearFromTopicItemId(id: string): number {
  return Number(id.slice('__year-'.length))
}

export function flattenTopicList({
  groups,
  loadingMore,
  showEmpty,
}: {
  groups: { notes: { id: string }[]; year: number }[]
  loadingMore: boolean
  showEmpty: boolean
}): FlattenedTopicListItem[] {
  const items: FlattenedTopicListItem[] = [
    {
      id: TOPIC_CHROME_ID,
      type: 'chrome',
      estimatedHeight: topicListEstimatedHeight.chrome,
    },
  ]
  if (showEmpty) {
    items.push({
      id: TOPIC_EMPTY_ID,
      type: 'empty',
      estimatedHeight: topicListEstimatedHeight.empty,
    })
  }
  for (const group of groups) {
    items.push({
      id: topicYearItemId(group.year),
      type: 'year',
      estimatedHeight: topicListEstimatedHeight.year,
    })
    for (const note of group.notes) {
      items.push({
        id: note.id,
        type: 'note',
        estimatedHeight: topicListEstimatedHeight.note,
      })
    }
  }
  if (loadingMore) {
    items.push({
      id: TOPIC_FOOTER_ID,
      type: 'footer',
      estimatedHeight: topicListEstimatedHeight.footer,
    })
  }
  return items
}
