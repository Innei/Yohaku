import { localDayKey } from '@/lib/datetime'

export function groupThinkingsByDay<T extends { createdAt: Date }>(
  items: T[],
): { items: T[]; key: string }[] {
  const groups: { items: T[]; key: string }[] = []
  for (const item of items) {
    const key = localDayKey(item.createdAt)
    const last = groups.at(-1)
    if (last?.key === key) last.items.push(item)
    else groups.push({ items: [item], key })
  }
  return groups
}
