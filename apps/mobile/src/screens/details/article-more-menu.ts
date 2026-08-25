export function groupMenuItemsByCategory<
  T extends { category?: string; hidden?: boolean },
>(items: T[]): T[][] {
  const groups: T[][] = []
  for (const item of items) {
    if (item.hidden) continue
    const last = groups.at(-1)
    if (last && last[0]?.category === item.category) last.push(item)
    else groups.push([item])
  }
  return groups
}
