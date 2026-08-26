'use client'
import { sx, sxClass } from '../../../lib/sx'
import { extras } from '../../../styles/extras.stylex'
import { atoms } from '../../../styles/atoms.stylex'

import clsx from 'clsx'
import { useMemo } from 'react'

import { usePrintFallback } from '../../../host'

import { ImagePlaceholder } from '../../../lib/image-placeholder'
import {
  AfilmoryGlyph,
  buildFilterHref,
  buildPhotoDetailHref,
  resolveAssetUrl,
} from './_shared'
import type {
  AfilmoryLayout,
  AfilmoryListItem,
  AfilmorySlotProps,
  AfilmorySource,
} from './afilmory-augment'
import type {
  AfilmoryManifestPhoto,
  AfilmoryManifestPhotoExif,
  AfilmorySearchParams,
} from './use-afilmory-manifest'
import {
  useAfilmoryPhotoDirect,
  useAfilmoryPhotosByIds,
  useAfilmoryPhotosSearch,
} from './use-afilmory-manifest'

const DEFAULT_LIMIT_FILTER = 12
const DEFAULT_LIMIT_LIST = 24

export function AfilmoryRenderer(props: AfilmorySlotProps) {
  const printFallback = usePrintFallback('afilmory', {
    title: 'title' in props && typeof props.title === 'string' ? props.title : '',
  })
  if (printFallback !== null) {
    return <p className="print-block-fallback">{printFallback}</p>
  }
  const isSingle =
    props.source.kind === 'list' && props.source.items.length === 1
  if (isSingle && props.source.kind === 'list') {
    return (
      <AfilmoryPolaroidView
        accent={props.accent}
        alt={props.alt}
        baseUrl={props.baseUrl}
        caption={props.caption}
        item={props.source.items[0]!}
      />
    )
  }
  return <AfilmoryGalleryView {...props} />
}

function aspectFromDims(w: number, h: number): string {
  if (w > 0 && h > 0) return `${w} / ${h}`
  return '3 / 2'
}

function getDisplayAspect(photo: AfilmoryManifestPhoto): string {
  return aspectFromDims(photo.width, photo.height)
}

function formatShutter(s: string | number | undefined | null): string | null {
  if (s === undefined || s === null || s === '') return null
  if (typeof s === 'number') {
    if (!Number.isFinite(s)) return null
    return s >= 1 ? `${s}s` : `1/${Math.round(1 / s)}s`
  }
  const str = String(s)
  if (str.includes('/')) return `${str}s`
  const n = Number(str)
  if (!Number.isFinite(n)) return str
  return n >= 1 ? `${n}s` : `1/${Math.round(1 / n)}s`
}
