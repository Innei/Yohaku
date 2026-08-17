'use client'

import clsx from 'clsx'
import { useMemo } from 'react'

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

// ────────────────────────────────────────────────────────────────────────────
// Single-photo polaroid view (source.kind === 'list' && ids.length === 1)
// ────────────────────────────────────────────────────────────────────────────

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

function formatCameraLine(
  exif: AfilmoryManifestPhotoExif | undefined,
): string | null {
  if (!exif) return null
  const camera = [exif.Make, exif.Model]
    .filter(Boolean)
    .map((s) => s!.trim())
    .filter(Boolean)
    .join(' ')
  const lens = exif.LensModel?.trim()
  const parts = [camera, lens].filter((p): p is string => Boolean(p))
  return parts.length > 0 ? parts.join(' · ') : null
}

function formatExifParams(
  exif: AfilmoryManifestPhotoExif | undefined,
): string | null {
  if (!exif) return null
  const focal = exif.FocalLength?.replace(/\s*mm$/i, 'mm')
  const aperture = typeof exif.FNumber === 'number' ? `f/${exif.FNumber}` : null
  const shutter = formatShutter(exif.ExposureTime)
  const iso = typeof exif.ISO === 'number' ? `ISO ${exif.ISO}` : null
  const parts = [focal, aperture, shutter, iso].filter((p): p is string =>
    Boolean(p && p.trim()),
  )
  return parts.length > 0 ? parts.join(' · ') : null
}

function formatStaticCaption(
  id: string,
  exif: AfilmoryManifestPhotoExif | undefined,
): string {
  const model = exif?.Model?.trim()
  const focal = exif?.FocalLength?.replace(/\s*mm$/i, 'mm')
  if (model && focal) return `${id} · ${model} @ ${focal}`
  if (model) return `${id} · ${model}`
  return id
}

const polaroidShellClass = clsx(
  'group/afilmory relative mx-auto my-8 block w-full max-w-[440px] font-sans',
  'cursor-pointer overflow-hidden no-underline',
  'bg-white dark:bg-neutral-2',
  'shadow-[0_3px_14px_rgba(0,0,0,0.10)] dark:shadow-[0_3px_18px_rgba(0,0,0,0.45)]',
  'transition-[translate,rotate,box-shadow] duration-[260ms] ease-out',
  'hover:-translate-y-[3px] hover:-rotate-[0.4deg]',
  'hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.55)]',
  'p-[12px] pb-[52px]',
)

function PolaroidShell({
  accent,
  asLink,
  children,
  href,
}: {
  accent?: string
  asLink: boolean
  children: React.ReactNode
  href?: string
}) {
  const style = accent
    ? ({ '--afilmory-accent': accent } as React.CSSProperties)
    : undefined
  if (asLink && href) {
    return (
      <a
        className={polaroidShellClass}
        href={href}
        rel="noopener noreferrer"
        style={style}
        target="_blank"
      >
        {children}
      </a>
    )
  }
  return (
    <div className={polaroidShellClass} role="figure" style={style}>
      {children}
    </div>
  )
}

function PolaroidHoverOverlay({
  cameraLine,
  caption,
  paramsLine,
}: {
  cameraLine: string | null
  caption: string | null
  paramsLine: string | null
}) {
  return (
    <div
      className={clsx(
        'pointer-events-none absolute inset-0 flex flex-col justify-end p-4',
        'bg-gradient-to-b from-transparent via-black/55 to-black/85',
        'opacity-0 transition-opacity duration-[220ms] ease-out',
        'group-hover/afilmory:opacity-100',
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-[4px] px-2 py-[3px]',
            'border border-white/12 bg-black/55',
            'font-mono text-[9px] tracking-[0.12em] text-white',
          )}
        >
          <AfilmoryGlyph className="size-[11px]" />
          AFILMORY
        </span>
        <span className="font-mono text-[9px] tracking-[0.12em] text-white/85">
          View ↗
        </span>
      </div>
      {caption ? (
        <div className="mb-1 text-sm leading-snug text-white/95">{caption}</div>
      ) : null}
      {cameraLine ? (
        <div className="font-mono text-[11px] text-white/90">{cameraLine}</div>
      ) : null}
      {paramsLine ? (
        <div className="mt-0.5 font-mono text-[10px] text-white/60">
          {paramsLine}
        </div>
      ) : null}
    </div>
  )
}

function PolaroidFootStatic({
  caption,
  watermark = false,
}: {
  caption: string
  watermark?: boolean
}) {
  return (
    <div className="absolute right-[18px] bottom-[14px] left-[18px] flex items-baseline justify-between gap-2">
      <span className="font-mono text-[13px] text-neutral-7 dark:text-neutral-7">
        {caption}
      </span>
      {watermark ? (
        <span className="font-mono text-[9px] tracking-[0.15em] text-neutral-5 dark:text-neutral-6">
          AFILMORY
        </span>
      ) : null}
    </div>
  )
}

function AfilmoryPolaroidView({
  accent,
  alt,
  baseUrl,
  caption,
  item,
}: {
  accent?: string
  alt?: string
  baseUrl: string
  caption?: string
  item: AfilmoryListItem
}) {
  const { id } = item
  const aspectRatio = aspectFromDims(item.w, item.h)
  const detailHref = buildPhotoDetailHref(baseUrl, id)

  const {
    data: photo,
    error,
    isError,
    isLoading,
  } = useAfilmoryPhotoDirect(baseUrl, id)

  if (isError) {
    const hint =
      error instanceof Error ? error.message : 'Manifest fetch failed'
    return (
      <PolaroidShell accent={accent} asLink={false}>
        <div
          className="relative flex w-full items-center justify-center bg-neutral-3 px-6 text-center dark:bg-neutral-1"
          style={{ aspectRatio }}
        >
          <div className="font-mono text-caption-12 text-neutral-7">{hint}</div>
        </div>
        <PolaroidFootStatic caption={id} />
      </PolaroidShell>
    )
  }

  const cameraLine = photo ? formatCameraLine(photo.exif) : null
  const paramsLine = photo ? formatExifParams(photo.exif) : null
  const renderedCaption = caption ?? photo?.description ?? null
  const altText = alt ?? renderedCaption ?? photo?.title ?? id
  const staticCap = photo ? formatStaticCaption(id, photo.exif) : id
  const thumbnailSrc = photo
    ? resolveAssetUrl(baseUrl, photo.thumbnailUrl)
    : undefined

  return (
    <PolaroidShell asLink accent={accent} href={detailHref}>
      <div
        className="relative w-full overflow-hidden bg-neutral-1 dark:bg-neutral-1"
        style={{ aspectRatio }}
      >
        {item.hash ? (
          <ImagePlaceholder
            accent={accent}
            className="absolute inset-0 size-full object-cover"
            thumbhash={item.hash}
          />
        ) : (
          <div
            aria-hidden
            className={clsx(
              'absolute inset-0',
              isLoading
                ? 'animate-pulse bg-neutral-2 dark:bg-neutral-3'
                : 'bg-neutral-3 dark:bg-neutral-1',
            )}
          />
        )}
        {thumbnailSrc ? (
          <img
            alt={altText}
            className="absolute inset-0 size-full object-cover"
            decoding="async"
            draggable={false}
            loading="lazy"
            src={thumbnailSrc}
            style={{ borderRadius: 0, width: '100%', height: '100%' }}
          />
        ) : null}
        <PolaroidHoverOverlay
          cameraLine={cameraLine}
          caption={renderedCaption}
          paramsLine={paramsLine}
        />
      </div>
      <PolaroidFootStatic watermark caption={staticCap} />
    </PolaroidShell>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Multi-photo / filter gallery view
// ────────────────────────────────────────────────────────────────────────────

function useCollectionPhotos(
  baseUrl: string,
  source: AfilmorySource,
  limit: number | undefined,
) {
  const ids = source.kind === 'list' ? source.items.map((i) => i.id) : []
  const listQuery = useAfilmoryPhotosByIds(baseUrl, ids)

  const searchParams = useMemo<AfilmorySearchParams>(() => {
    if (source.kind !== 'filter') return {}
    return { ...source.filter, limit: limit ?? DEFAULT_LIMIT_FILTER }
  }, [source, limit])
  const filterQuery = useAfilmoryPhotosSearch(baseUrl, searchParams, {
    enabled: source.kind === 'filter',
  })

  if (source.kind === 'list') {
    const photos = listQuery.data ?? []
    const cap = limit ?? DEFAULT_LIMIT_LIST
    return {
      error: listQuery.error,
      isError: listQuery.isError,
      isLoading: listQuery.isLoading,
      photos: cap && photos.length > cap ? photos.slice(0, cap) : photos,
    }
  }
  return {
    error: filterQuery.error,
    isError: filterQuery.isError,
    isLoading: filterQuery.isLoading,
    photos: filterQuery.data?.data ?? [],
  }
}

interface GalleryTile {
  aspect: string
  hash?: string
  id: string
  photo?: AfilmoryManifestPhoto
}

function tilesFromSource(
  source: AfilmorySource,
  photos: AfilmoryManifestPhoto[],
  limit: number | undefined,
): GalleryTile[] {
  if (source.kind === 'list') {
    const cap = limit ?? DEFAULT_LIMIT_LIST
    const items = source.items.slice(0, cap)
    const photoById = new Map(photos.map((p) => [p.id, p] as const))
    return items.map((item) => ({
      id: item.id,
      aspect: aspectFromDims(item.w, item.h),
      hash: item.hash,
      photo: photoById.get(item.id),
    }))
  }
  return photos.map((p) => ({
    id: p.id,
    aspect: getDisplayAspect(p),
    hash: p.thumbHash,
    photo: p,
  }))
}

function summarizeSource(source: AfilmorySource, total: number): string {
  const count = `${total} ${total === 1 ? 'photo' : 'photos'}`
  if (source.kind === 'list') return count
  const f = source.filter
  const parts: string[] = []
  if (f.tags?.length) {
    const sep = f.tagMode === 'intersection' ? ' ∧ ' : ', '
    parts.push(f.tags.map((t) => `#${t}`).join(sep))
  }
  if (f.cameras?.length) parts.push(`📷 ${f.cameras.join(', ')}`)
  if (f.lenses?.length) parts.push(`🔭 ${f.lenses.join(', ')}`)
  if (f.dateFrom || f.dateTo) {
    parts.push(`${f.dateFrom ?? '∞'} → ${f.dateTo ?? '∞'}`)
  }
  if (f.search) parts.push(`"${f.search}"`)
  const filterSummary = parts.join(' · ')
  return filterSummary ? `${count} · ${filterSummary}` : count
}

function frameStyle(
  accent: string | undefined,
): React.CSSProperties | undefined {
  return accent
    ? ({ '--afilmory-accent': accent } as React.CSSProperties)
    : undefined
}

const frameOuterClass = clsx(
  'not-prose mx-auto my-8 font-sans',
  'bg-neutral-1 ring-1 ring-border dark:bg-neutral-2',
)

const headerClass = clsx(
  'flex items-center justify-between gap-4 px-4 py-3',
  'border-b border-border bg-paper',
)

function CollectionHeader({
  source,
  title,
  total,
  viewAllHref,
}: {
  source: AfilmorySource
  title: string | undefined
  total: number
  viewAllHref: string
}) {
  const summary = summarizeSource(source, total)
  return (
    <header className={headerClass}>
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="truncate text-sm leading-tight font-semibold text-neutral-9">
            {title}
          </div>
        ) : null}
        <div className="mt-0.5 truncate font-mono text-[10px] leading-tight text-neutral-6">
          {summary}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] text-neutral-6">
          <AfilmoryGlyph className="size-[11px]" />
          AFILMORY
        </span>
        <span aria-hidden className="h-3 w-px bg-neutral-4" />
        <a
          className="font-mono text-[10px] tracking-[0.12em] text-neutral-7 uppercase transition-colors hover:text-(--afilmory-accent,--color-accent)"
          href={viewAllHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          View All ↗
        </a>
      </div>
    </header>
  )
}

function gridClassFor(layout: AfilmoryLayout): string {
  if (layout === 'masonry') {
    return 'columns-2 gap-1 sm:columns-3 md:columns-4'
  }
  return 'columns-2 gap-1.5 sm:columns-3 md:columns-4'
}

function PhotoTile({
  accent,
  baseUrl,
  tile,
}: {
  accent?: string
  baseUrl: string
  tile: GalleryTile
}) {
  const { photo } = tile
  const thumb = photo ? resolveAssetUrl(baseUrl, photo.thumbnailUrl) : undefined
  const href = buildPhotoDetailHref(baseUrl, tile.id)

  return (
    <a
      href={href}
      rel="noopener noreferrer"
      style={{ aspectRatio: tile.aspect }}
      target="_blank"
      className={clsx(
        'group/tile relative mb-1 block overflow-hidden no-underline break-inside-avoid',
        'bg-neutral-2 dark:bg-neutral-1',
      )}
    >
      {tile.hash ? (
        <ImagePlaceholder
          accent={accent}
          className="absolute inset-0 size-full object-cover"
          thumbhash={tile.hash}
        />
      ) : null}
      {thumb ? (
        <img
          alt={photo?.title ?? tile.id}
          className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover/tile:scale-[1.04]"
          decoding="async"
          draggable={false}
          loading="lazy"
          src={thumb}
          style={{ borderRadius: 0 }}
        />
      ) : null}
      <div
        className={clsx(
          'absolute inset-0 flex items-end p-2',
          'bg-gradient-to-t from-black/55 via-transparent to-transparent',
          'opacity-0 transition-opacity duration-200 group-hover/tile:opacity-100',
        )}
      >
        <span className="font-mono text-[10px] tracking-[0.06em] text-white/90">
          {tile.id}
        </span>
      </div>
    </a>
  )
}

function CarouselRow({
  accent,
  baseUrl,
  tiles,
}: {
  accent?: string
  baseUrl: string
  tiles: GalleryTile[]
}) {
  return (
    <div className="relative overflow-x-auto">
      <div className="flex gap-1 px-2 pb-2">
        {tiles.map((tile) => {
          const { photo } = tile
          const thumb = photo
            ? resolveAssetUrl(baseUrl, photo.thumbnailUrl)
            : undefined
          const href = buildPhotoDetailHref(baseUrl, tile.id)
          return (
            <a
              className="group/tile relative block h-[220px] shrink-0 overflow-hidden no-underline"
              href={href}
              key={tile.id}
              rel="noopener noreferrer"
              style={{ aspectRatio: tile.aspect }}
              target="_blank"
            >
              {tile.hash ? (
                <ImagePlaceholder
                  accent={accent}
                  className="absolute inset-0 size-full object-cover"
                  thumbhash={tile.hash}
                />
              ) : null}
              {thumb ? (
                <img
                  alt={photo?.title ?? tile.id}
                  className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover/tile:scale-[1.04]"
                  decoding="async"
                  draggable={false}
                  loading="lazy"
                  src={thumb}
                  style={{ borderRadius: 0, width: '100%', height: '100%' }}
                />
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex items-end bg-gradient-to-t from-black/55 to-transparent p-2 opacity-0 transition-opacity group-hover/tile:opacity-100">
                <span className="font-mono text-[10px] tracking-[0.06em] text-white/90">
                  {tile.id}
                </span>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function PhotoCollectionBody({
  accent,
  baseUrl,
  layout,
  tiles,
}: {
  accent?: string
  baseUrl: string
  layout: AfilmoryLayout
  tiles: GalleryTile[]
}) {
  if (layout === 'carousel') {
    return <CarouselRow accent={accent} baseUrl={baseUrl} tiles={tiles} />
  }
  return (
    <div className={clsx('p-2', gridClassFor(layout))}>
      {tiles.map((tile) => (
        <PhotoTile
          accent={accent}
          baseUrl={baseUrl}
          key={tile.id}
          tile={tile}
        />
      ))}
    </div>
  )
}

function StateBlock({ message }: { message: string }) {
  return (
    <div className="flex min-h-[120px] items-center justify-center px-6 py-8 text-center font-mono text-[12px] text-neutral-7">
      {message}
    </div>
  )
}

const SKELETON_HEIGHTS = [
  'h-[180px]',
  'h-[240px]',
  'h-[200px]',
  'h-[280px]',
  'h-[160px]',
  'h-[220px]',
]

function SkeletonGrid({
  layout,
  limit,
}: {
  layout: AfilmoryLayout
  limit: number
}) {
  const slots = Array.from({ length: limit }, (_, i) => ({
    height: SKELETON_HEIGHTS[i % SKELETON_HEIGHTS.length]!,
    key: `skel-${i}`,
  }))
  if (layout === 'carousel') {
    return (
      <div className="flex gap-1 overflow-hidden px-2 pb-2">
        {slots.map((s) => (
          <div
            className="h-[220px] w-[300px] shrink-0 animate-pulse bg-neutral-3 dark:bg-neutral-3"
            key={s.key}
          />
        ))}
      </div>
    )
  }
  return (
    <div className={clsx('p-2', gridClassFor(layout))}>
      {slots.map((s) => (
        <div
          key={s.key}
          className={clsx(
            'mb-1 w-full animate-pulse bg-neutral-3 break-inside-avoid dark:bg-neutral-3',
            s.height,
          )}
        />
      ))}
    </div>
  )
}

function AfilmoryGalleryView({
  accent,
  baseUrl,
  caption,
  layout = 'grid',
  limit,
  source,
  title,
}: AfilmorySlotProps) {
  const { error, isError, isLoading, photos } = useCollectionPhotos(
    baseUrl,
    source,
    limit,
  )

  const tiles = useMemo(
    () => tilesFromSource(source, photos, limit),
    [source, photos, limit],
  )

  const viewAllHref =
    source.kind === 'filter'
      ? buildFilterHref(baseUrl, source.filter)
      : `${baseUrl.replace(/\/$/, '')}/`

  if (tiles.length === 0 && isLoading) {
    return (
      <figure className={frameOuterClass} style={frameStyle(accent)}>
        <CollectionHeader
          source={source}
          title={title}
          total={limit ?? 8}
          viewAllHref={viewAllHref}
        />
        <SkeletonGrid layout={layout} limit={limit ?? 8} />
        {caption ? (
          <figcaption className="px-5 pt-1 pb-3 text-sm text-neutral-7">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    )
  }

  if (tiles.length === 0 && isError) {
    return (
      <figure className={frameOuterClass} style={frameStyle(accent)}>
        <CollectionHeader
          source={source}
          title={title}
          total={0}
          viewAllHref={viewAllHref}
        />
        <StateBlock
          message={
            error instanceof Error ? error.message : 'Photos fetch failed'
          }
        />
      </figure>
    )
  }

  if (tiles.length === 0) {
    return (
      <figure className={frameOuterClass} style={frameStyle(accent)}>
        <CollectionHeader
          source={source}
          title={title}
          total={0}
          viewAllHref={viewAllHref}
        />
        <StateBlock message="No photos matched" />
      </figure>
    )
  }

  return (
    <figure className={frameOuterClass} style={frameStyle(accent)}>
      <CollectionHeader
        source={source}
        title={title}
        total={tiles.length}
        viewAllHref={viewAllHref}
      />
      <PhotoCollectionBody
        accent={accent}
        baseUrl={baseUrl}
        layout={layout}
        tiles={tiles}
      />
      {caption ? (
        <figcaption className="px-5 pt-2 pb-3 text-sm text-neutral-7">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
