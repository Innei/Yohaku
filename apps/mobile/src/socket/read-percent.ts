export function readPercent({
  bodyHeight,
  bodyTop,
  scrollTop,
  viewportHeight,
}: {
  bodyHeight: number
  bodyTop: number
  scrollTop: number
  viewportHeight: number
}): number {
  if (bodyHeight <= 0) return 0
  const deltaHeight = Math.min(scrollTop, viewportHeight)
  return (
    Math.floor(
      Math.min(
        Math.max(0, ((scrollTop - bodyTop + deltaHeight) / bodyHeight) * 100),
        100,
      ),
    ) || 0
  )
}
