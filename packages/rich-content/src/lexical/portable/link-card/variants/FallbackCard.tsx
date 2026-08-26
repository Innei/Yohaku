import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'
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
      {...sx(atoms.w_full, atoms.max_w__36rem, className)}
      href={data.url}
      style={shellStyle}
    >
      <div {...sx(atoms.min_w_0, atoms.flex_1)}>
        <div {...sx(atoms.line_clamp_2, atoms.text_copy_16, atoms.leading_6, atoms.font_medium, atoms.text_neutral_10)}>
          {data.title}
        </div>
        {data.description && (
          <div {...sx(atoms.mt_2, atoms.line_clamp_2, atoms.text__0dot9375rem, atoms.leading_relaxed, atoms.text_neutral_7)}>
            {data.description}
          </div>
        )}
        <MetaRow {...sx(atoms.flex_nowrap, atoms.overflow_hidden)}>
          <span {...sx(atoms.inline_flex, atoms.shrink_0, atoms.items_center, atoms.gap_1dot5)}>
            <LinkFavicon
              {...sx(atoms.mr_0, atoms.inline_flex, atoms.size__14px, atoms.shrink_0, atoms.items_center, atoms.justify_center, atoms._and_svg_inline, atoms._and_svg_h__14pximportant_, atoms._and_svg_w__14pximportant_)}
              getPlatformFromUrl={getPlatformFromUrl}
              href={data.url}
              platformIconMap={platformIconMap}
            />
            <span
              {...sx(site ? atoms.text_neutral_7 : [atoms.font_mono, atoms.text_neutral_6])}
            >
              {primaryLabel}
            </span>
          </span>
          {author && (
            <span {...sx(atoms.min_w_0, atoms.truncate, atoms.text_neutral_6)}>{author}</span>
          )}
          {year && <span {...sx(atoms.shrink_0, atoms.text_neutral_6)}>{year}</span>}
          {readingTime && (
            <span {...sx(atoms.shrink_0, atoms.text_neutral_6)}>{readingTime}</span>
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
