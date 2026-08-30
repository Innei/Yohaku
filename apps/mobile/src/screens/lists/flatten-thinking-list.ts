export const THINKING_CHROME_ID = '__chrome'

export const thinkingListEstimatedHeight = {
  chrome: 64,
  day: 36,
  thinking: 160,
} as const

export type FlattenedThinkingListItem = {
  estimatedHeight: number
  id: string
  type: 'chrome' | 'day' | 'thinking'
}

export function thinkingDayItemId(key: string): string {
  return `__day-${key}`
}

export function flattenThinkingList({
  groups,
}: {
  groups: { items: { id: string }[]; key: string }[]
}): FlattenedThinkingListItem[] {
  const items: FlattenedThinkingListItem[] = [
    {
      id: THINKING_CHROME_ID,
      type: 'chrome',
      estimatedHeight: thinkingListEstimatedHeight.chrome,
    },
  ]
  for (const group of groups) {
    items.push({
      id: thinkingDayItemId(group.key),
      type: 'day',
      estimatedHeight: thinkingListEstimatedHeight.day,
    })
    for (const item of group.items) {
      items.push({
        id: item.id,
        type: 'thinking',
        estimatedHeight: thinkingListEstimatedHeight.thinking,
      })
    }
  }
  return items
}
