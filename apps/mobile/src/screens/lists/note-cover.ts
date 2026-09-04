import { thumbHashToDataURL } from 'thumbhash'

export function noteCoverUrl(note: {
  coverUrl?: string | null
}): string | null {
  const url = note.coverUrl?.trim()
  return url || null
}

export function noteCoverThumbhash(
  coverUrl: string | null,
  images?: { src?: string | null; thumbhash?: string | null }[] | null,
): string | null {
  if (!coverUrl || !images?.length) return null
  const hash = images
    .find((image) => image.src?.trim() === coverUrl)
    ?.thumbhash?.trim()
  return hash || null
}

function bytesFromHash(hash: string): Uint8Array | undefined {
  try {
    if (hash.length % 2 === 0 && /^[\da-f]+$/i.test(hash)) {
      const out = new Uint8Array(hash.length / 2)
      for (let i = 0; i < hash.length; i += 2) {
        out[i / 2] = Number.parseInt(hash.slice(i, i + 2), 16)
      }
      return out
    }
    return Uint8Array.from(atob(hash), (c) => c.codePointAt(0)!)
  } catch {
    return undefined
  }
}

export function noteCoverPlaceholderUri(
  thumbhash?: string | null,
): string | null {
  const hash = thumbhash?.trim()
  if (!hash) return null
  const bytes = bytesFromHash(hash)
  if (!bytes) return null
  try {
    return thumbHashToDataURL(bytes)
  } catch {
    return null
  }
}

export const NOTE_LATEST_HERO_HEIGHT = 248
export const NOTE_LATEST_TEXT_HERO_HEIGHT = 98

const NOTE_COVER_BLEED_BELOW_NAV = 84

export function noteDetailCoverHeight(headerHeight: number) {
  return headerHeight + NOTE_COVER_BLEED_BELOW_NAV
}

export function noteDetailCoverAnchorY(headerHeight: number) {
  return -headerHeight
}
