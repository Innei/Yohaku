export const featuredSummaryChars = 150
export const indexSummaryChars = 80
export const postListPageSize = 20

export function nextPostListPage(
  loadedCount: number,
  fetchedPage: number,
  pageSize = postListPageSize,
): number {
  const inferred = Math.max(1, Math.floor(loadedCount / pageSize))
  return Math.max(inferred, fetchedPage) + 1
}

export function hasMorePosts(
  loadedCount: number,
  total: number | null,
  pageSize = postListPageSize,
): boolean {
  if (total !== null) return loadedCount < total
  return loadedCount >= pageSize
}

const tagVisibleBudget = 24
const cjkRe = /[\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]/

export function pickFeaturedPost<T extends { pinAt: Date | null }>(
  posts: T[],
): { featured: T; rest: T[] } | { featured: null; rest: T[] } {
  const index = posts.findIndex((post) => post.pinAt !== null)
  if (index === -1) return { featured: null, rest: posts }
  return {
    featured: posts[index],
    rest: posts.filter((_, i) => i !== index),
  }
}

export function postListSummary(
  post: { excerpt: string | null; text: string | null },
  maxChars: number,
): string {
  const excerpt = post.excerpt?.trim()
  if (excerpt) return excerpt
  const text = post.text?.trim()
  if (!text) return ''
  return text.length <= maxChars ? text : text.slice(0, maxChars)
}

function weighTag(value: string): number {
  return Array.from(value).reduce(
    (sum, char) => sum + (cjkRe.test(char) ? 2 : 1),
    0,
  )
}

export function partitionTags(tags: string[]): {
  hiddenCount: number
  visible: string[]
} {
  let used = 0
  const visible: string[] = []
  for (const tag of tags) {
    const cost = weighTag(tag) + 2
    if (used + cost > tagVisibleBudget && visible.length > 0) break
    visible.push(tag)
    used += cost
  }
  return { hiddenCount: tags.length - visible.length, visible }
}
