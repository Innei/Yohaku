export const CAROUSEL_HEIGHT = 260
const PEEK_WIDTH_RATIO = 0.85
const PORTRAIT_RATIO_CAP = 4 / 5
const LANDSCAPE_RATIO_CAP = 16 / 9

interface Size {
  height: number
  width: number
}

function aspectOf({ height, width }: Size): number {
  return width > 0 && height > 0 ? width / height : 1
}

export function carouselTileWidths(items: Size[], cardWidth: number): number[] {
  const maxWidth = cardWidth * PEEK_WIDTH_RATIO
  return items.map((item) =>
    Math.min(CAROUSEL_HEIGHT * aspectOf(item), maxWidth),
  )
}

export function singleMediaRatio(size: Size): number {
  return Math.min(
    Math.max(aspectOf(size), PORTRAIT_RATIO_CAP),
    LANDSCAPE_RATIO_CAP,
  )
}

export const CAROUSEL_GAP = 4

export function carouselOffsets(widths: number[]): number[] {
  return widths.map((_, index) =>
    widths
      .slice(0, index)
      .reduce((sum, width) => sum + width + CAROUSEL_GAP, 0),
  )
}

export function carouselPage(
  offsets: number[],
  x: number,
  maxOffset: number,
): number {
  if (offsets.length > 0 && x >= maxOffset - 1) return offsets.length - 1
  let nearest = 0
  offsets.forEach((offset, index) => {
    if (Math.abs(offset - x) < Math.abs(offsets[nearest]! - x)) nearest = index
  })
  return nearest
}
