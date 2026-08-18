'use client'

import { useMemo } from 'react'

import { useHost } from '../../../host'
import { useResource } from '../../../lib/use-resource'

export interface AfilmoryManifestPhotoExif {
  Aperture?: number
  DateTimeOriginal?: string
  ExposureTime?: string | number
  FNumber?: number
  FocalLength?: string
  FocalLengthIn35mmFormat?: string
  GPSLatitude?: number
  GPSLongitude?: number
  ISO?: number
  LensMake?: string
  LensModel?: string
  Make?: string
  Model?: string
  Orientation?: number
  ShutterSpeed?: string
}

export interface AfilmoryManifestPhoto {
  aspectRatio?: number
  dateTaken?: string
  description?: string
  exif?: AfilmoryManifestPhotoExif
  height: number
  id: string
  isHDR?: boolean
  originalUrl: string
  tags?: string[]
  thumbHash?: string
  thumbnailUrl: string
  title?: string
  width: number
}

export interface AfilmoryManifest {
  data: AfilmoryManifestPhoto[]
  version: string
}

function normalizeGalleryUrl(galleryUrl: string): string {
  return galleryUrl.replace(/\/$/, '')
}

interface QueryLikeResult<T> {
  data: T | undefined
  error: unknown
  isError: boolean
  isLoading: boolean
}

function toQueryLike<T>(state: {
  data?: T
  error?: unknown
  isLoading: boolean
}): QueryLikeResult<T> {
  return {
    data: state.data,
    error: state.error,
    isError: state.error !== undefined,
    isLoading: state.isLoading,
  }
}

export function useAfilmoryManifest(galleryUrl: string) {
  const host = useHost()
  const base = normalizeGalleryUrl(galleryUrl)
  const state = useResource(`afilmory-manifest:${base}`, () =>
    host.fetchJSON<AfilmoryManifest>(`${base}/api/manifest`, {
      headers: { Accept: 'application/json' },
    }),
  )
  return toQueryLike(state)
}

export function useAfilmoryPhoto(galleryUrl: string, photoId: string) {
  const query = useAfilmoryManifest(galleryUrl)
  const photo = useMemo<AfilmoryManifestPhoto | undefined>(() => {
    return query.data?.data.find((p) => p.id === photoId)
  }, [query.data, photoId])
  return { ...query, photo }
}

export function useAfilmoryPhotoDirect(galleryUrl: string, photoId: string) {
  const host = useHost()
  const base = normalizeGalleryUrl(galleryUrl)
  const state = useResource(
    photoId ? `afilmory-photo:${base}:${photoId}` : null,
    () =>
      host.fetchJSON<AfilmoryManifestPhoto>(
        `${base}/api/manifest/photos/${encodeURIComponent(photoId)}`,
        { headers: { Accept: 'application/json' } },
      ),
  )
  return toQueryLike(state)
}

export function useAfilmoryPhotosByIds(galleryUrl: string, ids: string[]) {
  const host = useHost()
  const base = normalizeGalleryUrl(galleryUrl)
  const normalizedIds = useMemo(() => [...ids], [ids])
  const key =
    normalizedIds.length > 0
      ? `afilmory-photos-by-ids:${base}:${normalizedIds.join(',')}`
      : null
  const state = useResource(key, () => {
    const qs = new URLSearchParams({ ids: normalizedIds.join(',') })
    return host.fetchJSON<AfilmoryManifestPhoto[]>(
      `${base}/api/manifest/photos?${qs.toString()}`,
      { headers: { Accept: 'application/json' } },
    )
  })
  return toQueryLike(state)
}

export interface AfilmorySearchParams {
  cameras?: string[]
  dateFrom?: string
  dateTo?: string
  lenses?: string[]
  limit?: number
  offset?: number
  rating?: number
  sort?: 'asc' | 'desc'
  tagMode?: 'union' | 'intersection'
  tags?: string[]
}

export interface AfilmorySearchResponse {
  data: AfilmoryManifestPhoto[]
  total: number
}

function toRequestBody(params: AfilmorySearchParams): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (params.tags?.length) body.tags = params.tags
  if (params.tagMode) body.tagMode = params.tagMode
  if (params.cameras?.length) body.cameras = params.cameras
  if (params.lenses?.length) body.lenses = params.lenses
  if (params.rating !== undefined) body.rating = params.rating
  if (params.dateFrom) body.from = params.dateFrom
  if (params.dateTo) body.to = params.dateTo
  if (params.sort) body.sort = params.sort
  if (params.limit !== undefined) body.limit = params.limit
  if (params.offset !== undefined) body.offset = params.offset
  return body
}

export function useAfilmoryPhotosSearch(
  galleryUrl: string,
  params: AfilmorySearchParams,
  options: { enabled?: boolean } = {},
) {
  const host = useHost()
  const base = normalizeGalleryUrl(galleryUrl)
  const enabled = (options.enabled ?? true) && Boolean(galleryUrl)
  const key = enabled
    ? `afilmory-search:${base}:${JSON.stringify(params)}`
    : null
  const state = useResource(key, () =>
    host.fetchJSON<AfilmorySearchResponse>(
      `${base}/api/manifest/photos/search`,
      {
        body: JSON.stringify(toRequestBody(params)),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ),
  )
  return toQueryLike(state)
}
