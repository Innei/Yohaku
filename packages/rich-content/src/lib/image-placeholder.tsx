import { thumbHashToDataURL } from 'thumbhash'

type Props = {
  thumbhash?: string
  accent?: string
  width?: number
  height?: number
  className?: string
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

function decode(hash: string): string | undefined {
  const bytes = bytesFromHash(hash)
  if (!bytes) return undefined
  try {
    return thumbHashToDataURL(bytes)
  } catch {
    return undefined
  }
}

export function ImagePlaceholder({
  thumbhash,
  accent,
  width,
  height,
  className,
}: Props) {
  const src = thumbhash ? decode(thumbhash) : undefined
  const fillStyle: React.CSSProperties = {
    borderRadius: 0,
    width: width ?? '100%',
    height: height ?? '100%',
  }
  if (src) {
    return (
      <img
        aria-hidden
        alt=""
        className={className}
        src={src}
        style={fillStyle}
      />
    )
  }
  if (accent) {
    return (
      <div
        aria-hidden
        className={className}
        style={{ background: accent, ...fillStyle }}
      />
    )
  }
  return null
}
