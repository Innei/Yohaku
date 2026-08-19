export function mergeHits<T extends { id: string }>(
  local: T[],
  remote: T[],
): T[] {
  const seen = new Set(local.map((item) => item.id))
  const extra = remote.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
  return [...local, ...extra]
}

export function routablePostHit(item: {
  category?: { slug?: string | null } | null
  id?: unknown
  slug?: unknown
}): { categorySlug: string; id: string; slug: string } | null {
  if (typeof item.id !== 'string' || item.id.length === 0) return null
  if (typeof item.slug !== 'string' || item.slug.length === 0) return null
  const categorySlug = item.category?.slug
  if (typeof categorySlug !== 'string' || categorySlug.length === 0) return null
  return { categorySlug, id: item.id, slug: item.slug }
}

export function routableNoteHit(item: {
  hasPassword?: unknown
  id?: unknown
  nid?: unknown
}): { hasPassword: boolean; id: string; nid: number } | null {
  if (typeof item.id !== 'string' || item.id.length === 0) return null
  if (typeof item.nid !== 'number' || !Number.isFinite(item.nid)) return null
  return {
    hasPassword: item.hasPassword === true,
    id: item.id,
    nid: item.nid,
  }
}
