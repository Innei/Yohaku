'use client'
import { sx } from '../../../../lib/sx'
import { atoms } from '../../../../styles/atoms.stylex'

import { ImagePlaceholder } from '../../../../lib/image-placeholder'
import type { MediaSource } from './media-source'

interface Props {
  alt: string
  source: MediaSource
}

const DEFAULT_RATIO = 1200 / 630

export function OgThumbnail({ source, alt }: Props): React.ReactElement {
  const { width, height } = source
  const rawRatio = width && height ? width / height : DEFAULT_RATIO
  // Portrait sources are usually logos misdetected as cover art; ultra-wide
  // banners would collapse the thumbnail to a sliver. Clamp both ends.
  const safeRatio = rawRatio < 1 ? DEFAULT_RATIO : Math.min(rawRatio, 3)

  return (
    <div
      {...sx(atoms.relative, atoms.w__8dot75rem, atoms.shrink_0, atoms.self_start, atoms.overflow_hidden, atoms.rounded_lg, atoms.bg_neutral_2)}
      style={{ aspectRatio: safeRatio }}
    >
      {source.thumbhash && (
        <div
          aria-hidden
          {...sx(atoms.pointer_events_none, atoms.absolute, atoms.inset_0, atoms.size_full)}
        >
          <ImagePlaceholder
            {...sx(atoms.size_full, atoms.object_cover)}
            thumbhash={source.thumbhash}
          />
        </div>
      )}
      <img
        alt={alt}
        {...sx(atoms.absolute, atoms.inset_0, atoms.size_full, atoms.object_cover)}
        loading="lazy"
        src={source.url}
      />
    </div>
  )
}
