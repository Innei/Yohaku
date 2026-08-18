import type { Locale } from '@/i18n/config'
import { translate } from '@/i18n/translate'
import { groupNotesByYear } from '@/screens/lists/note-timeline'

export const maxTaxonomyTags = 2

export function postHasTag(tags: string[], name: string): boolean {
  return tags.includes(name)
}

export function visibleTaxonomyTags(tags: string[], max = maxTaxonomyTags) {
  return {
    hiddenCount: Math.max(0, tags.length - max),
    visible: tags.slice(0, max),
  }
}

export function earliestPostYear(
  posts: { createdAt: Date }[],
): number | undefined {
  if (posts.length === 0) return undefined
  return Math.min(...posts.map((post) => post.createdAt.getFullYear()))
}

export function categoryShowsYear(
  count: number,
  earliestYear: number | undefined,
  nowYear: number,
): boolean {
  return count > 1 && earliestYear !== undefined && earliestYear < nowYear
}

export function categoryDisplayName(
  category: { name: string } | undefined,
  posts: { categoryName: string | null }[],
  slug: string,
): string {
  return category?.name || posts[0]?.categoryName || slug
}

export function sumTags(
  posts: { tags: string[] }[],
): { count: number; name: string }[] {
  const map = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ count, name }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

export function crossCategoryCounts(
  posts: { categoryName: string | null; categorySlug: string | null }[],
): { count: number; name: string; slug: string }[] {
  const map = new Map<string, { count: number; name: string; slug: string }>()
  for (const post of posts) {
    const slug = post.categorySlug
    if (!slug) continue
    const existing = map.get(slug)
    if (existing) existing.count += 1
    else
      map.set(slug, {
        count: 1,
        name: post.categoryName ?? slug,
        slug,
      })
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  )
}

export function taxonomyYearGroups<T extends { createdAt: Date }>(
  items: T[],
): {
  groupByYear: boolean
  groups: { items: T[]; year: number }[]
} {
  const groupByYear = new Set(items.map((item) => item.createdAt.getFullYear()))
    .size >= 2
  if (!groupByYear) {
    return {
      groupByYear: false,
      groups: items.length
        ? [{ items, year: items[0].createdAt.getFullYear() }]
        : [],
    }
  }
  return {
    groupByYear: true,
    groups: groupNotesByYear(items).map((group) => ({
      items: group.notes,
      year: group.year,
    })),
  }
}

export function formatTaxonomyDate(
  date: Date,
  locale: Locale,
  includeYear: boolean,
): string {
  const month = date.getMonth() + 1
  const day = date.getDate()
  return includeYear
    ? translate(locale, 'time', 'yearMonthDay', {
        year: date.getFullYear(),
        month,
        day,
      })
    : translate(locale, 'time', 'monthDay', { month, day })
}

export function decodeRouteParam(
  value: string | string[] | undefined,
): string {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
