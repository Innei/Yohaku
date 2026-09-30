import { groupTocSections } from '@/lib/article-toc'
import type { LexicalHeading } from '@/lib/lexical-headings'

type RawPresenceMap = Record<
  string,
  { identity?: unknown; position?: unknown } | null | undefined
>

export function otherReaderPositions(
  presence: RawPresenceMap | null | undefined,
  selfIdentity: string,
): number[] {
  if (!presence) return []
  return Object.entries(presence).flatMap(([key, value]) => {
    if (!value) return []
    const identity = typeof value.identity === 'string' ? value.identity : key
    const position = value.position
    if (identity === selfIdentity) return []
    if (typeof position !== 'number' || !Number.isFinite(position)) return []
    return [Math.min(100, Math.max(0, position))]
  })
}

export function sectionIndexAt(starts: number[], position: number): number {
  let index = 0
  starts.forEach((start, i) => {
    if (start <= position) index = i
  })
  return index
}

export function sectionReaders(starts: number[], positions: number[]): number[] {
  const counts = starts.map(() => 0)
  for (const position of positions) counts[sectionIndexAt(starts, position)]! += 1
  return counts
}

export function readingCount(others: number): number | null {
  return others > 0 ? others + 1 : null
}

export interface TocPresence {
  perSection: number[] | null
  selfSection: number | null
  total: number | null
}

export function buildTocPresence({
  contentHeight,
  headings,
  offsetFor,
  readers,
  self,
}: {
  contentHeight: number
  headings: LexicalHeading[]
  offsetFor: (blockId: string) => number | null
  readers: number[]
  self: number
}): TocPresence {
  const total = readingCount(readers.length)
  const offsets = groupTocSections(headings).map((section) =>
    offsetFor(section.root.blockId),
  )
  if (contentHeight <= 0 || offsets.length === 0 || offsets.includes(null)) {
    return { perSection: null, selfSection: null, total }
  }
  const starts = offsets.map((y) => ((y ?? 0) / contentHeight) * 100)
  return {
    perSection: sectionReaders(starts, readers),
    selfSection: sectionIndexAt(starts, self),
    total,
  }
}
