import type { PostRow } from '@/db/schema'
import type { Locale } from '@/i18n/config'

import { formatTaxonomyDate, visibleTaxonomyTags } from './taxonomy-model'

export const TAXONOMY_CHROME_ID = '__chrome'
export const TAXONOMY_CHIPS_ID = '__chips'
export const TAXONOMY_EMPTY_ID = '__empty'

export const taxonomyListEstimatedHeight = {
  chips: 88,
  chrome: 96,
  empty: 64,
  featured: 180,
  post: 72,
  year: 88,
} as const

export type FlattenedTaxonomyListItem = {
  categoryName?: string
  categorySlug?: string
  date?: string
  estimatedHeight: number
  hiddenTagCount?: number
  id: string
  tags?: string[]
  title?: string
  type: 'chips' | 'chrome' | 'empty' | 'featured' | 'post' | 'year'
}

type TaxonomyListPost = Pick<
  PostRow,
  'categoryName' | 'categorySlug' | 'createdAt' | 'id' | 'tags' | 'title'
>

export function taxonomyYearItemId(year: number): string {
  return `__year-${year}`
}

export function yearFromTaxonomyItemId(id: string): number {
  return Number(id.slice('__year-'.length))
}

export function flattenTaxonomyList({
  featuredId,
  groupByYear,
  groups,
  locale,
  showChips,
  showCategorySource,
  showEmpty,
}: {
  featuredId: string | null
  groupByYear: boolean
  groups: { items: TaxonomyListPost[]; year: number }[]
  locale: Locale
  showChips: boolean
  showCategorySource: boolean
  showEmpty: boolean
}): FlattenedTaxonomyListItem[] {
  const items: FlattenedTaxonomyListItem[] = [
    {
      id: TAXONOMY_CHROME_ID,
      type: 'chrome',
      estimatedHeight: taxonomyListEstimatedHeight.chrome,
    },
  ]
  if (featuredId) {
    items.push({
      id: featuredId,
      type: 'featured',
      estimatedHeight: taxonomyListEstimatedHeight.featured,
    })
  }
  if (showEmpty) {
    items.push({
      id: TAXONOMY_EMPTY_ID,
      type: 'empty',
      estimatedHeight: taxonomyListEstimatedHeight.empty,
    })
  }
  for (const group of groups) {
    if (groupByYear) {
      items.push({
        id: taxonomyYearItemId(group.year),
        type: 'year',
        estimatedHeight: taxonomyListEstimatedHeight.year,
      })
    }
    for (const item of group.items) {
      const { hiddenCount, visible } = visibleTaxonomyTags(item.tags)
      items.push({
        categoryName: showCategorySource ? (item.categoryName ?? '') : '',
        categorySlug: showCategorySource ? (item.categorySlug ?? '') : '',
        date: formatTaxonomyDate(item.createdAt, locale, !groupByYear),
        id: item.id,
        type: 'post',
        estimatedHeight: taxonomyListEstimatedHeight.post,
        hiddenTagCount: showCategorySource ? 0 : hiddenCount,
        tags: showCategorySource ? [] : visible,
        title: item.title,
      })
    }
  }
  if (showChips) {
    items.push({
      id: TAXONOMY_CHIPS_ID,
      type: 'chips',
      estimatedHeight: taxonomyListEstimatedHeight.chips,
    })
  }
  return items
}
