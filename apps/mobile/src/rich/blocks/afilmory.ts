export interface AfilmoryListItem {
  h: number
  hash?: string
  id: string
  w: number
}

export interface AfilmoryFilter {
  cameras?: string[]
  dateFrom?: string
  dateTo?: string
  lenses?: string[]
  search?: string
  tagMode?: 'intersection' | 'union'
  tags?: string[]
}

export type AfilmorySource =
  | { filter: AfilmoryFilter; kind: 'filter' }
  | { items: AfilmoryListItem[]; kind: 'list' }

export interface AfilmoryExif {
  ExposureTime?: number | string
  FNumber?: number
  FocalLength?: string
  ISO?: number
  Model?: string
}

export interface AfilmoryPhoto {
  description?: string
  exif?: AfilmoryExif
  height: number
  id: string
  originalUrl: string
  thumbHash?: string
  thumbnailUrl: string
  title?: string
  width: number
}

export interface AlbumTile {
  full?: string
  h: number
  hash?: string
  id: string
  thumb?: string
  w: number
}

const PORTRAIT_RATIO_CAP = 4 / 5
const DEFAULT_RATIO = 3 / 2

const trimBase = (baseUrl: string) => baseUrl.replace(/\/$/, '')

export function afilmorySource(
  node: Record<string, unknown>,
): AfilmorySource | null {
  const source = node.source as Record<string, unknown> | null | undefined
  if (!source || typeof source !== 'object') return null
  if (
    source.kind === 'filter' &&
    source.filter &&
    typeof source.filter === 'object'
  ) {
    return { filter: source.filter as AfilmoryFilter, kind: 'filter' }
  }
  if (source.kind !== 'list' || !Array.isArray(source.items)) return null
  const items: AfilmoryListItem[] = []
  for (const raw of source.items) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    if (typeof item.id !== 'string') continue
    items.push({
      h: typeof item.h === 'number' ? item.h : 0,
      hash: typeof item.hash === 'string' ? item.hash : undefined,
      id: item.id,
      w: typeof item.w === 'number' ? item.w : 0,
    })
  }
  return items.length > 0 ? { items, kind: 'list' } : null
}

export function resolveAssetUrl(baseUrl: string, url: string): string {
  if (/^https?:\/\//i.test(url) || url.startsWith('//')) return url
  try {
    return new URL(url, baseUrl).toString()
  } catch {
    return url
  }
}

export function photoDetailHref(baseUrl: string, id: string): string {
  return `${trimBase(baseUrl)}/photos/${encodeURIComponent(id)}`
}

export function filterHref(baseUrl: string, filter: AfilmoryFilter): string {
  const params = new URLSearchParams()
  if (filter.tags?.length) params.set('tags', filter.tags.join(','))
  if (filter.cameras?.length) params.set('cameras', filter.cameras.join(','))
  if (filter.lenses?.length) params.set('lenses', filter.lenses.join(','))
  if (filter.dateFrom) params.set('from', filter.dateFrom)
  if (filter.dateTo) params.set('to', filter.dateTo)
  if (filter.tagMode && filter.tagMode !== 'union') {
    params.set('tag_mode', filter.tagMode)
  }
  const query = params.toString()
  return query ? `${trimBase(baseUrl)}/?${query}` : `${trimBase(baseUrl)}/`
}

export function searchBody(
  filter: AfilmoryFilter,
  limit: number,
): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (filter.tags?.length) body.tags = filter.tags
  if (filter.tagMode) body.tagMode = filter.tagMode
  if (filter.cameras?.length) body.cameras = filter.cameras
  if (filter.lenses?.length) body.lenses = filter.lenses
  if (filter.dateFrom) body.from = filter.dateFrom
  if (filter.dateTo) body.to = filter.dateTo
  body.limit = limit
  return body
}

function formatShutter(value: number | string | undefined): string | null {
  if (value === undefined || value === '') return null
  if (typeof value === 'string' && value.includes('/')) return `${value}s`
  const seconds = Number(value)
  if (!Number.isFinite(seconds)) return String(value)
  return seconds >= 1 ? `${seconds}s` : `1/${Math.round(1 / seconds)}s`
}

export function exifLine(exif: AfilmoryExif | undefined): string | undefined {
  if (!exif) return undefined
  const parts = [
    exif.Model?.trim(),
    exif.FocalLength?.replace(/\s*mm$/i, 'mm'),
    typeof exif.FNumber === 'number' ? `ƒ/${exif.FNumber}` : null,
    formatShutter(exif.ExposureTime),
    typeof exif.ISO === 'number' ? `ISO\u00A0${exif.ISO}` : null,
  ].filter((part): part is string => Boolean(part))
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export function polaroidRatio(width: number, height: number): number {
  if (width <= 0 || height <= 0) return DEFAULT_RATIO
  return Math.max(width / height, PORTRAIT_RATIO_CAP)
}

export function summarizeSource(source: AfilmorySource, total: number): string {
  const count = `${total} ${total === 1 ? 'photo' : 'photos'}`
  if (source.kind === 'list') return count
  const { filter } = source
  const parts: string[] = [count]
  if (filter.tags?.length) {
    const separator = filter.tagMode === 'intersection' ? ' ∧ ' : ', '
    parts.push(filter.tags.map((tag) => `#${tag}`).join(separator))
  }
  if (filter.cameras?.length) parts.push(`📷 ${filter.cameras.join(', ')}`)
  if (filter.lenses?.length) parts.push(`🔭 ${filter.lenses.join(', ')}`)
  if (filter.dateFrom || filter.dateTo) {
    parts.push(`${filter.dateFrom ?? '∞'} → ${filter.dateTo ?? '∞'}`)
  }
  if (filter.search) parts.push(`"${filter.search}"`)
  return parts.join(' · ')
}

export function masonryColumns(items: { h: number; w: number }[]): number[][] {
  const columns: number[][] = [[], []]
  const heights = [0, 0]
  items.forEach((item, index) => {
    const column = heights[1]! < heights[0]! ? 1 : 0
    columns[column]!.push(index)
    heights[column]! += item.w > 0 && item.h > 0 ? item.h / item.w : 1
  })
  return columns
}

export function photoUrls(
  baseUrl: string,
  photo: AfilmoryPhoto | undefined,
): { full?: string; thumb?: string } {
  return {
    full: photo?.originalUrl
      ? resolveAssetUrl(baseUrl, photo.originalUrl)
      : undefined,
    thumb: photo?.thumbnailUrl
      ? resolveAssetUrl(baseUrl, photo.thumbnailUrl)
      : undefined,
  }
}

export function albumTiles(
  baseUrl: string,
  source: AfilmorySource,
  photos: AfilmoryPhoto[],
): AlbumTile[] {
  if (source.kind === 'filter') {
    return photos.map((photo) => ({
      ...photoUrls(baseUrl, photo),
      h: photo.height,
      hash: photo.thumbHash,
      id: photo.id,
      w: photo.width,
    }))
  }
  const byId = new Map(photos.map((photo) => [photo.id, photo]))
  return source.items.map((item) => {
    const photo = byId.get(item.id)
    return {
      ...photoUrls(baseUrl, photo),
      h: item.h,
      hash: item.hash ?? photo?.thumbHash,
      id: item.id,
      w: item.w,
    }
  })
}
