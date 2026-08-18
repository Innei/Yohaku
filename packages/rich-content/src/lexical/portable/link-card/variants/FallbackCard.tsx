import { LinkFavicon } from '@haklex/rich-editor/static'
import type { CSSProperties, FC } from 'react'

import type { HostEnrichment } from '../../../../host'
import { clsxm } from '../../../../lib/clsxm'
import { getPlatformFromUrl, platformIconMap } from '../../platform-icons'
import { LinkCardShell, MetaRow, OgThumbnail } from '../atoms'
import { imageToSource } from '../atoms/media-source'
import { fmtYear, hostOf, strAttr } from '../enrichment'

interface Props {
  className?: string
  data: HostEnrichment
}

const HEX_RE = /^#[\da-f]{6}$/i

export const FallbackCard: FC<Props> = ({ data, className }) => {
  const site = strAttr(data, 'site')
  const author = strAttr(data, 'author')
  const readingTime = strAttr(data, 'reading_time')
  const year = fmtYear(data.publishedAt)

  // Site attribute (e.g. "YouTube", "GitHub Blog") replaces the bare host
  // when the page advertised it via og:site_name — punchier, less generic.
  const primaryLabel = site ?? hostOf(data.url)

  const paletteDominant = data.captureImage?.palette?.dominant
  const accent =
    typeof data.color === 'string' && HEX_RE.test(data.color)
      ? data.color
      : typeof paletteDominant === 'string' && HEX_RE.test(paletteDominant)
        ? paletteDominant
        : null
  const shellStyle: CSSProperties | undefined = accent
    ? ({ '--color-accent': accent } as CSSProperties)
    : undefined

  const thumbnailImage = data.thumbnailImage ?? data.image
  const thumbnail = imageToSource(thumbnailImage)

  return (
    <LinkCardShell
      external
      className={clsxm('w-full max-w-[36rem]', className)}
      href={data.url}
      style={shellStyle}
    >
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-copy-16 leading-6 font-medium text-neutral-10">
          {data.title}
        </div>
        {data.description && (
          <div className="mt-2 line-clamp-2 text-[0.9375rem] leading-relaxed text-neutral-7">
            {data.description}
          </div>
        )}
        <MetaRow className="flex-nowrap overflow-hidden">
          <span className="inline-flex shrink-0 items-center gap-1.5">
            <LinkFavicon
              className="mr-0 inline-flex size-[14px] shrink-0 items-center justify-center [&_svg]:inline [&_svg]:h-[14px]! [&_svg]:w-[14px]!"
              getPlatformFromUrl={getPlatformFromUrl}
              href={data.url}
              platformIconMap={platformIconMap}
            />
            <span
              className={site ? 'text-neutral-7' : 'font-mono text-neutral-6'}
            >
              {primaryLabel}
            </span>
          </span>
          {author && (
            <span className="min-w-0 truncate text-neutral-6">{author}</span>
          )}
          {year && <span className="shrink-0 text-neutral-6">{year}</span>}
          {readingTime && (
            <span className="shrink-0 text-neutral-6">{readingTime}</span>
          )}
        </MetaRow>
      </div>
      {thumbnail && (
        <OgThumbnail
          alt={thumbnailImage?.alt ?? data.title}
          source={thumbnail}
        />
      )}
    </LinkCardShell>
  )
}
