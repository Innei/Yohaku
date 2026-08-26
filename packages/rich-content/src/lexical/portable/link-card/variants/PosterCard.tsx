'use client'
import { sx, sxClass } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'

import type { CSSProperties, FC } from 'react'
import { useState } from 'react'

import type { HostEnrichment } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import { ImagePlaceholder } from '../../../../lib/image-placeholder'
import { HostStamp, LinkCardShell, MetaRow } from '../atoms'
import { findAttr, hostOf, strAttr } from '../enrichment'

// Aspect drives image *width* — height is taken from the card itself via
// flex stretch, so the poster always fills the card's full vertical extent
// without leaving top/bottom whitespace. `object-cover` on the inner <img>
// absorbs any minor mismatch between slot aspect and the source image.
const ASPECT_BY_KIND = {
  movie: '2 / 3',
  book: '5 / 7',
  album: '1 / 1',
} as const

type PosterKind = keyof typeof ASPECT_BY_KIND

// Fixed card height. Aspect-derived width × stretched height creates a
// feedback loop with content-driven card height: a wider poster narrows
// the content column, which wraps text to more lines, which grows the
// card, which widens the poster again. Pinning the card to one value
// breaks the loop and keeps every poster variant the same physical size.
// Content beyond this clips via the shell's `overflow-hidden`.
const CARD_HEIGHT = '7rem'

// Expanded mode trades the edge-to-edge full-height poster for a smaller,
// rounded thumbnail on the *right*, with the card's natural padding restored
// and description allowed to wrap freely. Width is pinned per kind; height
// follows aspect, so the poster's intrinsic shape stays intact regardless
// of how much copy the description column carries.
const EXPANDED_POSTER_WIDTH: Record<PosterKind, string> = {
  movie: '5rem',
  book: '5rem',
  album: '5.5rem',
}

// WKWebView doesn't treat the chained stretch heights (anchor → inner row →
// poster slot) as definite, so the aspect-ratio transferred width falls back
// to the image's intrinsic width and the poster swallows the whole card.
// Pin the compact slot width explicitly: CARD_HEIGHT × aspect.
const COMPACT_POSTER_WIDTH: Record<PosterKind, string> = {
  movie: `calc(${CARD_HEIGHT} * 2 / 3)`,
  book: `calc(${CARD_HEIGHT} * 5 / 7)`,
  album: CARD_HEIGHT,
}

// Auto-expand threshold. Short descriptions stay in the dense compact card;
// longer ones trade density for the expanded layout so the copy isn't
// truncated.
const AUTO_EXPAND_DESC_THRESHOLD = 80

const HEX_RE = /^#[\da-f]{6}$/i

interface Props {
  className?: string
  data: HostEnrichment
  expanded?: boolean
  kind: PosterKind
  topCaps?: string
}

export const PosterCard: FC<Props> = ({
  data,
  className,
  kind,
  topCaps,
  expanded,
}) => {
  const aspect = ASPECT_BY_KIND[kind]
  const subtype = data.subtype ?? ''
  const isMusicSong = subtype === 'song'
  const isMusicAlbum = subtype === 'album' || subtype === 'music'
  const isBook = subtype === 'book' || kind === 'book'
  const isMovieLike = subtype === 'movie' || subtype === 'tv'

  const desc = pickDesc(data, {
    isMusicSong,
    isMusicAlbum,
    isBook,
    isMovieLike,
  })

  const hex = typeof data.color === 'string' && HEX_RE.test(data.color)
  const washStyle: CSSProperties | undefined = hex
    ? ({ '--wash-color': data.color } as CSSProperties)
    : undefined

  const flags = { isMusicSong, isMusicAlbum, isBook, isMovieLike }

  const shouldExpand =
    expanded ?? (!!desc && desc.length > AUTO_EXPAND_DESC_THRESHOLD)

  if (shouldExpand) {
    return (
      <LinkCardShell
        external
        className={clsxm(hex && 'yohaku-poster-card-wash', className)}
        href={data.url}
        style={washStyle}
      >
        <div {...sx(atoms.flex, atoms.min_w_0, atoms.flex_1, atoms.flex_col)}>
          {topCaps && (
            <div {...sx(atoms.mb_1, atoms.text_label_12, atoms.font_semibold, atoms.tracking_widest, atoms.text_neutral_6, atoms.uppercase)}>
              {topCaps}
            </div>
          )}
          <div {...sx(atoms.text_copy_14, atoms.font_semibold, atoms.leading_snug, atoms.text_neutral_10)}>
            {data.title}
          </div>
          {desc && (
            <div {...sx(atoms.mt_1, atoms.text_copy_14, atoms.leading_normal, atoms.text_neutral_7)}>
              {desc}
            </div>
          )}
          <MetaRow {...sx(atoms.flex_nowrap, atoms.overflow_hidden)}>
            {renderMeta(data, flags)}
          </MetaRow>
        </div>
        <ExpandedPoster aspect={aspect} data={data} kind={kind} />
      </LinkCardShell>
    )
  }

  return (
    <LinkCardShell
      external
      href={data.url}
      // `items-stretch` propagates anchor height to the inner row, so the
      // poster slot can match the card's full vertical extent. The shell
      // ships with `items-center` by default, which would cap the poster
      // to its intrinsic content height and leave whitespace.
      innerClassName="gap-0 self-stretch items-stretch"
      style={{ ...washStyle, height: CARD_HEIGHT }}
      {...sx(atoms.important_gap_0, atoms.important_px_0, atoms.important_py_0, atoms.important_items_stretch, hex && 'yohaku-poster-card-wash', className)}
    >
      <PosterImage aspect={aspect} data={data} kind={kind} />
      <div {...sx(atoms.flex, atoms.min_w_0, atoms.flex_1, atoms.flex_col, atoms.justify_center, atoms.px_4, atoms.py_3)}>
        {topCaps && (
          <div {...sx(atoms.mb_1, atoms.text_label_12, atoms.font_semibold, atoms.tracking_widest, atoms.text_neutral_6, atoms.uppercase)}>
            {topCaps}
          </div>
        )}
        <div {...sx(atoms.line_clamp_2, atoms.text_copy_14, atoms.font_semibold, atoms.leading_snug, atoms.text_neutral_10)}>
          {data.title}
        </div>
        {desc && (
          <div {...sx(atoms.mt_1, atoms.line_clamp_1, atoms.text_copy_14, atoms.leading_normal, atoms.text_neutral_7)}>
            {desc}
          </div>
        )}
        <MetaRow {...sx(atoms.flex_nowrap, atoms.overflow_hidden)}>
          {renderMeta(data, flags)}
        </MetaRow>
      </div>
    </LinkCardShell>
  )
}

interface SubtypeFlags {
  isBook: boolean
  isMovieLike: boolean
  isMusicAlbum: boolean
  isMusicSong: boolean
}

function pickDesc(data: HostEnrichment, flags: SubtypeFlags): string | null {
  if (flags.isMovieLike) return data.description ?? null
  if (flags.isMusicSong || flags.isMusicAlbum) {
    const artist = strAttr(data, 'artist')
    if (artist) return artist
    return data.description ?? null
  }
  if (flags.isBook) {
    const author = strAttr(data, 'author')
    return author ?? null
  }
  return null
}

function renderMeta(data: HostEnrichment, flags: SubtypeFlags) {
  const host = hostOf(data.url)
  const ratingAttr = findAttr(data, 'rating')
  const genres = strAttr(data, 'genres')
  const albumName = strAttr(data, 'albumName') ?? strAttr(data, 'album')

  if (flags.isMovieLike) {
    return [
      ratingAttr ? (
        <span {...sx(atoms.inline_flex, atoms.shrink_0, atoms.items_center, atoms.gap_1)} key="r">
          <i {...sxClass("i-mingcute-star-fill", atoms.text__0dot875em)} />
          {fmtRating(ratingAttr.value)}
        </span>
      ) : null,
      genres ? (
        <span {...sx(atoms.min_w_0, atoms.truncate)} key="g">
          {genres}
        </span>
      ) : null,
      <span {...sx(atoms.shrink_0, atoms.text_neutral_6)} key="h">
        {host}
      </span>,
    ]
  }

  if (flags.isMusicSong) {
    return [
      albumName ? (
        <span {...sx(atoms.min_w_0, atoms.truncate)} key="a">
          《{albumName}》
        </span>
      ) : null,
      <span {...sx(atoms.shrink_0, atoms.text_neutral_6)} key="h">
        {host}
      </span>,
      <PlayPill key="p" />,
    ]
  }

  if (flags.isMusicAlbum) {
    return [
      <span {...sx(atoms.shrink_0, atoms.text_neutral_6)} key="h">
        {host}
      </span>,
      <PlayPill key="p" />,
    ]
  }

  if (flags.isBook) {
    return [
      ratingAttr ? (
        <span {...sx(atoms.inline_flex, atoms.shrink_0, atoms.items_center, atoms.gap_1)} key="r">
          <i {...sxClass("i-mingcute-star-fill", atoms.text__0dot875em)} />
          {fmtRating(ratingAttr.value)}
        </span>
      ) : null,
      <span {...sx(atoms.shrink_0, atoms.text_neutral_6)} key="h">
        {host}
      </span>,
    ]
  }

  return [
    <span {...sx(atoms.shrink_0, atoms.text_neutral_6)} key="h">
      {host}
    </span>,
  ]
}

const PlayPill: FC = () => (
  <span
    aria-hidden
    {...sx(atoms.inline_flex, atoms.items_center, atoms.gap_1, atoms.rounded_sm, atoms.bg_neutral_2, atoms.px_1dot5, atoms.py_px, atoms.text_label_12, atoms.text_neutral_7)}
  >
    <i className="i-mingcute-play-fill" />
  </span>
)

interface PosterImageProps {
  aspect: string
  data: HostEnrichment
  kind: PosterKind
}

const PosterImage: FC<PosterImageProps> = ({ data, aspect, kind }) => {
  const [loaded, setLoaded] = useState(false)
  const image = data.thumbnailImage

  if (!image?.url) {
    return (
      <div {...sx(atoms.flex, atoms.shrink_0, atoms.items_center, atoms.justify_center, atoms.self_stretch, atoms.pl_4)}>
        <HostStamp />
      </div>
    )
  }

  // `self-stretch` makes the slot match the card height; the explicit width
  // (CARD_HEIGHT × aspect) does the job aspect-ratio alone can't in
  // WKWebView, so a 1:1 album poster lands as a perfect square that fills
  // the card top-to-bottom.
  return (
    <div
      {...sx(atoms.relative, atoms.shrink_0, atoms.self_stretch, atoms.overflow_hidden, atoms.bg_neutral_2)}
      style={{ aspectRatio: aspect, width: COMPACT_POSTER_WIDTH[kind] }}
    >
      {image.thumbhash && (
        <div
          aria-hidden
          {...sx(atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms.size_full, atoms.transition_opacity, atoms.duration__250ms)}
          style={{ opacity: loaded ? 0 : 1 }}
        >
          <ImagePlaceholder
            {...sx(atoms.size_full, atoms.object_cover)}
            thumbhash={image.thumbhash}
          />
        </div>
      )}
      <img
        alt={image.alt ?? data.title}
        {...sx(atoms.size_full, atoms.object_cover)}
        height={image.height}
        loading="lazy"
        src={image.url}
        width={image.width}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

interface ExpandedPosterProps {
  aspect: string
  data: HostEnrichment
  kind: PosterKind
}

const ExpandedPoster: FC<ExpandedPosterProps> = ({ data, aspect, kind }) => {
  const [loaded, setLoaded] = useState(false)
  const image = data.thumbnailImage

  if (!image?.url) {
    return <HostStamp />
  }

  // Pinned width + aspect-derived height keeps the poster at its intrinsic
  // shape and decouples it from card height — the description column can
  // wrap as long as it needs without resizing the poster.
  return (
    <div
      {...sx(atoms.relative, atoms.shrink_0, atoms.self_start, atoms.overflow_hidden, atoms.rounded_lg, atoms.bg_neutral_2)}
      style={{ width: EXPANDED_POSTER_WIDTH[kind], aspectRatio: aspect }}
    >
      {image.thumbhash && (
        <div
          aria-hidden
          {...sx(atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms.size_full, atoms.transition_opacity, atoms.duration__250ms)}
          style={{ opacity: loaded ? 0 : 1 }}
        >
          <ImagePlaceholder
            {...sx(atoms.size_full, atoms.object_cover)}
            thumbhash={image.thumbhash}
          />
        </div>
      )}
      <img
        alt={image.alt ?? data.title}
        {...sx(atoms.size_full, atoms.object_cover)}
        height={image.height}
        loading="lazy"
        src={image.url}
        width={image.width}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

function fmtRating(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(1) : String(v ?? '')
}

function fmtYearLoose(s: string): string {
  const m = /^(\d{4})/.exec(s)
  return m ? m[1] : s
}

interface WrapperProps {
  className?: string
  data: HostEnrichment
  expanded?: boolean
}

export const MovieCard: FC<WrapperProps> = ({ data, className, expanded }) => (
  <PosterCard
    className={className}
    data={data}
    expanded={expanded}
    kind="movie"
    topCaps={
      data.subtype === 'tv'
        ? `TV${data.publishedAt ? ` · ${fmtYearLoose(data.publishedAt)}` : ''}`
        : `Movie${data.publishedAt ? ` · ${fmtYearLoose(data.publishedAt)}` : ''}`
    }
  />
)

export const BookCard: FC<WrapperProps> = ({ data, className, expanded }) => (
  <PosterCard
    className={className}
    data={data}
    expanded={expanded}
    kind="book"
    topCaps={`Book${data.publishedAt ? ` · ${fmtYearLoose(data.publishedAt)}` : ''}`}
  />
)

export const AlbumCard: FC<WrapperProps> = ({ data, className, expanded }) => {
  const isSong = data.subtype === 'song'
  const topCaps = isSong
    ? 'Song'
    : `Album${data.publishedAt ? ` · ${fmtYearLoose(data.publishedAt)}` : ''}`
  return (
    <PosterCard
      className={className}
      data={data}
      expanded={expanded}
      kind="album"
      topCaps={topCaps}
    />
  )
}
