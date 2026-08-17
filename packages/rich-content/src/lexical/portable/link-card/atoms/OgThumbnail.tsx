'use client'

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
      className="relative w-[8.75rem] shrink-0 self-start overflow-hidden rounded-lg bg-neutral-2"
      style={{ aspectRatio: safeRatio }}
    >
      {source.thumbhash && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 size-full"
        >
          <ImagePlaceholder
            className="size-full object-cover"
            thumbhash={source.thumbhash}
          />
        </div>
      )}
      <img
        alt={alt}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        src={source.url}
      />
    </div>
  )
}
