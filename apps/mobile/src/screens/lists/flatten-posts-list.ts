export const POST_LIST_CHROME_ID = '__chrome'
export const POST_LIST_COUNT_ID = '__count'
export const POST_LIST_FOOTER_ID = '__footer'

export const postListEstimatedHeight = {
  chrome: 92,
  count: 36,
  featured: 220,
  footer: 48,
  post: 88,
} as const

export type FlattenedPostListItem = {
  estimatedHeight: number
  id: string
  postId?: string
  type: 'chrome' | 'count' | 'featured' | 'footer' | 'post'
}

export function flattenPostsList({
  featuredId,
  loadingMore,
  restIds,
}: {
  featuredId: string | null
  loadingMore: boolean
  restIds: string[]
}): FlattenedPostListItem[] {
  const items: FlattenedPostListItem[] = [
    {
      id: POST_LIST_CHROME_ID,
      type: 'chrome',
      estimatedHeight: postListEstimatedHeight.chrome,
    },
  ]
  if (featuredId) {
    items.push({
      id: featuredId,
      type: 'featured',
      postId: featuredId,
      estimatedHeight: postListEstimatedHeight.featured,
    })
  }
  items.push({
    id: POST_LIST_COUNT_ID,
    type: 'count',
    estimatedHeight: postListEstimatedHeight.count,
  })
  for (const id of restIds) {
    items.push({
      id,
      type: 'post',
      postId: id,
      estimatedHeight: postListEstimatedHeight.post,
    })
  }
  if (loadingMore) {
    items.push({
      id: POST_LIST_FOOTER_ID,
      type: 'footer',
      estimatedHeight: postListEstimatedHeight.footer,
    })
  }
  return items
}

export function articleIdsFromVisible(
  items: { id: string; type: string }[],
  types: readonly string[] = ['featured', 'post'],
): string[] {
  const allowed = new Set(types)
  return items.filter((item) => allowed.has(item.type)).map((item) => item.id)
}
