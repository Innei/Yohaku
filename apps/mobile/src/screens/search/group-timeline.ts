import type { ApiNote, ApiPost } from '@/api/types'

export type SearchTimelineItem = {
  categorySlug?: string | null
  date: Date
  hasPassword?: boolean
  id: string
  meta: string | null
  nid?: number
  slug?: string
  title: string
}

export type SearchTimelineEntry = SearchTimelineItem & {
  day: string
}

export type SearchTimelineMonth = {
  items: SearchTimelineEntry[]
  label: string
  month: number
}

export type SearchTimelineYear = {
  count: number
  months: SearchTimelineMonth[]
  year: number
}

export function formatTimelineDay(date: Date): string {
  return String(date.getDate()).padStart(2, '0')
}

export function formatTimelineMonth(
  year: number,
  month: number,
  locale: string,
): string {
  const date = new Date(year, month, 1)
  const enShort = new Intl.DateTimeFormat('en-US', { month: 'short' })
    .format(date)
    .toUpperCase()

  if (locale.startsWith('en')) {
    return new Intl.DateTimeFormat('en', { month: 'long' })
      .format(date)
      .toUpperCase()
  }

  if (locale.startsWith('ko')) return `${month + 1}월 · ${enShort}`
  return `${month + 1}月 · ${enShort}`
}

export function timelineItemFromPost(row: {
  categoryName: string | null
  categorySlug: string | null
  createdAt: Date
  id: string
  slug: string
  title: string | null
}): SearchTimelineItem {
  return {
    categorySlug: row.categorySlug,
    date: row.createdAt,
    id: row.id,
    meta: row.categoryName,
    slug: row.slug,
    title: row.title ?? '',
  }
}

export function timelineItemFromNote(row: {
  createdAt: Date
  hasPassword: boolean
  id: string
  mood: string | null
  nid: number
  title: string | null
  weather: string | null
}): SearchTimelineItem {
  const meta = [row.weather, row.mood].filter(Boolean).join(' · ')
  return {
    date: row.createdAt,
    hasPassword: row.hasPassword,
    id: row.id,
    meta: meta || null,
    nid: row.nid,
    title: row.title ?? '',
  }
}

export function timelineItemFromApiPost(row: ApiPost): SearchTimelineItem {
  return timelineItemFromPost({
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    createdAt: new Date(row.createdAt),
    id: row.id,
    slug: row.slug,
    title: row.title,
  })
}

export function timelineItemFromApiNote(row: ApiNote): SearchTimelineItem {
  return timelineItemFromNote({
    createdAt: new Date(row.createdAt),
    hasPassword: row.hasPassword ?? false,
    id: row.id,
    mood: row.mood,
    nid: row.nid,
    title: row.title,
    weather: row.weather,
  })
}

export function groupSearchTimeline(
  items: SearchTimelineItem[],
  locale: string,
): SearchTimelineYear[] {
  const years = new Map<number, Map<number, SearchTimelineItem[]>>()

  for (const item of items) {
    const year = item.date.getFullYear()
    const month = item.date.getMonth()
    let yearBucket = years.get(year)
    if (!yearBucket) {
      yearBucket = new Map()
      years.set(year, yearBucket)
    }
    const monthBucket = yearBucket.get(month)
    if (monthBucket) monthBucket.push(item)
    else yearBucket.set(month, [item])
  }

  return [...years.keys()]
    .sort((a, b) => b - a)
    .map((year) => {
      const yearBucket = years.get(year)!
      const months = [...yearBucket.keys()]
        .sort((a, b) => b - a)
        .map((month) => {
          const monthItems = yearBucket.get(month)!
          monthItems.sort((a, b) => b.date.getTime() - a.date.getTime())
          return {
            items: monthItems.map((item) => ({
              ...item,
              day: formatTimelineDay(item.date),
            })),
            label: formatTimelineMonth(year, month, locale),
            month,
          }
        })
      return {
        count: months.reduce((sum, group) => sum + group.items.length, 0),
        months,
        year,
      }
    })
}
