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
      {...sx(
        atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms.flex, atoms.flex_col, atoms.justify_end, atoms.p_4,
        atoms.bg_gradient_to_b, atoms.from_transparent, atoms.via_black_55, atoms.to_black_85,
        atoms.opacity_0, atoms.transition_opacity, atoms.duration__220ms, atoms.ease_out,
        atoms.group_hover_afilmory_opacity_100,
      )}
    >
      <div {...sx(atoms.mb_2, atoms.flex, atoms.items_center, atoms.justify_between)}>
        <span
          {...sx(
            atoms.inline_flex, atoms.items_center, atoms.gap_1dot5, atoms.rounded__4px, atoms.px_2, atoms.py__3px,
            atoms.border, atoms.border_white_12, atoms.bg_black_55,
            atoms.font_mono, atoms.text__9px, atoms.tracking__0dot12em, atoms.text_white,
          )}
        >
          <AfilmoryGlyph {...sx(atoms.size__11px)} />
          AFILMORY
        </span>
        <span {...sx(atoms.font_mono, atoms.text__9px, atoms.tracking__0dot12em, atoms.text_white_85)}>
          View ↗
        </span>
      </div>
      {caption ? (
        <div {...sx(atoms.mb_1, atoms.text_sm, atoms.leading_snug, atoms.text_white_95)}>{caption}</div>
      ) : null}
      {cameraLine ? (
        <div {...sx(atoms.font_mono, atoms.text__11px, atoms.text_white_90)}>{cameraLine}</div>
      ) : null}
      {paramsLine ? (
        <div {...sx(atoms.mt_0dot5, atoms.font_mono, atoms.text__10px, atoms.text_white_60)}>
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
    <div {...sx(atoms.absolute, atoms.right__18px, atoms.bottom__14px, atoms.left__18px, atoms.flex, atoms.items_baseline, atoms.justify_between, atoms.gap_2)}>
      <span {...sx(atoms.font_mono, atoms.text__13px, atoms.text_neutral_7, atoms.dark_text_neutral_7)}>
        {caption}
      </span>
      {watermark ? (
        <span {...sx(atoms.font_mono, atoms.text__9px, atoms.tracking__0dot15em, atoms.text_neutral_5, atoms.dark_text_neutral_6)}>
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
          {...sx(atoms.relative, atoms.flex, atoms.w_full, atoms.items_center, atoms.justify_center, atoms.bg_neutral_3, atoms.px_6, atoms.text_center, atoms.dark_bg_neutral_1)}
          style={{ aspectRatio }}
        >
          <div {...sx(atoms.font_mono, atoms.text_neutral_7, extras.textCaption12)}>{hint}</div>
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
        {...sx(atoms.relative, atoms.w_full, atoms.overflow_hidden, atoms.bg_neutral_1, atoms.dark_bg_neutral_1)}
        style={{ aspectRatio }}
      >
        {item.hash ? (
          <ImagePlaceholder
            accent={accent}
            {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover)}
            thumbhash={item.hash}
          />
        ) : (
          <div
            aria-hidden
            {...sx(
              atoms.absolute, atoms.inset_0,
              isLoading
                ? [atoms.animate_pulse, atoms.bg_neutral_2, atoms.dark_bg_neutral_3]
                : [atoms.bg_neutral_3, atoms.dark_bg_neutral_1],
            )}
          />
        )}
        {thumbnailSrc ? (
          <img
            alt={altText}
            {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover)}
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
      <div {...sx(atoms.min_w_0, atoms.flex_1)}>
        {title ? (
          <div {...sx(atoms.truncate, atoms.text_sm, atoms.leading_tight, atoms.font_semibold, atoms.text_neutral_9)}>
            {title}
          </div>
        ) : null}
        <div {...sx(atoms.mt_0dot5, atoms.truncate, atoms.font_mono, atoms.text__10px, atoms.leading_tight, atoms.text_neutral_6)}>
          {summary}
        </div>
      </div>
      <div {...sx(atoms.flex, atoms.shrink_0, atoms.items_center, atoms.gap_3)}>
        <span {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.font_mono, atoms.text__9px, atoms.tracking__0dot12em, atoms.text_neutral_6)}>
          <AfilmoryGlyph {...sx(atoms.size__11px)} />
          AFILMORY
        </span>
        <span aria-hidden {...sx(atoms.h_3, atoms.w_px, atoms.bg_neutral_4)} />
        <a
          {...sx(atoms.font_mono, atoms.text__10px, atoms.tracking__0dot12em, atoms.text_neutral_7, atoms.uppercase, atoms.transition_colors, atoms.hover_text____afilmory_accent___color_accent)}
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
      {...sx(extras.breakInsideAvoid, atoms.relative, atoms.mb_1, atoms.block, atoms.overflow_hidden, atoms.no_underline, atoms.bg_neutral_2, atoms.dark_bg_neutral_1)} data-group="tile"
    >
      {tile.hash ? (
        <ImagePlaceholder
          accent={accent}
          {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover)}
          thumbhash={tile.hash}
        />
      ) : null}
      {thumb ? (
        <img
          alt={photo?.title ?? tile.id}
          {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover, atoms.transition_transform, atoms.duration_300, atoms.group_hover_tile_scale__1dot04)}
          decoding="async"
          draggable={false}
          loading="lazy"
          src={thumb}
          style={{ borderRadius: 0 }}
        />
      ) : null}
      <div
        {...sx(
          atoms.absolute, atoms.inset_0, atoms.flex, atoms.items_end, atoms.p_2,
          atoms.bg_gradient_to_t, atoms.from_black_55, atoms.via_transparent, atoms.to_transparent,
          atoms.opacity_0, atoms.transition_opacity, atoms.duration_200, atoms.group_hover_tile_opacity_100,
        )}
      >
        <span {...sx(atoms.font_mono, atoms.text__10px, atoms.tracking__0dot06em, atoms.text_white_90)}>
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
    <div {...sx(atoms.relative, atoms.overflow_x_auto)}>
      <div {...sx(atoms.flex, atoms.gap_1, atoms.px_2, atoms.pb_2)}>
        {tiles.map((tile) => {
          const { photo } = tile
          const thumb = photo
            ? resolveAssetUrl(baseUrl, photo.thumbnailUrl)
            : undefined
          const href = buildPhotoDetailHref(baseUrl, tile.id)
          return (
            <a
              {...sx(atoms.relative, atoms.block, atoms.h__220px, atoms.shrink_0, atoms.overflow_hidden, atoms.no_underline)} data-group="tile"
              href={href}
              key={tile.id}
              rel="noopener noreferrer"
              style={{ aspectRatio: tile.aspect }}
              target="_blank"
            >
              {tile.hash ? (
                <ImagePlaceholder
                  accent={accent}
                  {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover)}
                  thumbhash={tile.hash}
                />
              ) : null}
              {thumb ? (
                <img
                  alt={photo?.title ?? tile.id}
                  {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover, atoms.transition_transform, atoms.duration_300, atoms.group_hover_tile_scale__1dot04)}
                  decoding="async"
                  draggable={false}
                  loading="lazy"
                  src={thumb}
                  style={{ borderRadius: 0, width: '100%', height: '100%' }}
                />
              ) : null}
              <div {...sx(atoms.absolute, atoms.inset_x_0, atoms.bottom_0, atoms.flex, atoms.items_end, atoms.bg_gradient_to_t, atoms.from_black_55, atoms.to_transparent, atoms.p_2, atoms.opacity_0, atoms.transition_opacity, atoms.group_hover_tile_opacity_100)}>
                <span {...sx(atoms.font_mono, atoms.text__10px, atoms.tracking__0dot06em, atoms.text_white_90)}>
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
    <div {...sx(atoms.p_2, gridClassFor(layout))}>
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
    <div {...sx(atoms.flex, atoms.min_h__120px, atoms.items_center, atoms.justify_center, atoms.px_6, atoms.py_8, atoms.text_center, atoms.font_mono, atoms.text__12px, atoms.text_neutral_7)}>
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
      <div {...sx(atoms.flex, atoms.gap_1, atoms.overflow_hidden, atoms.px_2, atoms.pb_2)}>
        {slots.map((s) => (
          <div
            {...sx(atoms.h__220px, atoms.w__300px, atoms.shrink_0, atoms.animate_pulse, atoms.bg_neutral_3, atoms.dark_bg_neutral_3)}
            key={s.key}
          />
        ))}
      </div>
    )
  }
  return (
    <div {...sx(atoms.p_2, gridClassFor(layout))}>
      {slots.map((s) => (
        <div
          key={s.key}
          {...sx(extras.breakInsideAvoid, atoms.mb_1, atoms.w_full, atoms.animate_pulse, atoms.bg_neutral_3, atoms.dark_bg_neutral_3, s.height)}
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
          <figcaption {...sx(atoms.px_5, atoms.pt_1, atoms.pb_3, atoms.text_sm, atoms.text_neutral_7)}>
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
        <figcaption {...sx(atoms.px_5, atoms.pt_2, atoms.pb_3, atoms.text_sm, atoms.text_neutral_7)}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
