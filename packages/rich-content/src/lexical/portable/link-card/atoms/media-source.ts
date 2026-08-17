import type { HostEnrichmentImage } from '../../../../host'

export interface MediaSource {
  height?: number
  thumbhash?: string
  url: string
  width?: number
}

export function imageToSource(
  image: HostEnrichmentImage | undefined,
): MediaSource | null {
  if (!image?.url) return null
  return {
    url: image.url,
    width: image.width,
    height: image.height,
    thumbhash: image.thumbhash,
  }
}
