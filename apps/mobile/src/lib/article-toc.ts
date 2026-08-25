import type { Href } from 'expo-router'

import type { LexicalHeading } from '@/lib/lexical-headings'

export const TOC_SHEET = {
  bottom: 36,
  childRow: 40,
  header: 64,
  maxFirstFraction: 0.62,
  minFraction: 0.3,
  rootRow: 50,
  sectionGap: 10,
} as const

export type TocSection = {
  children: LexicalHeading[]
  root: LexicalHeading
}

type TocSession = {
  detents: number[]
  headings: LexicalHeading[]
}

type TocJump = (blockId: string) => void

let session: TocSession | null = null
const jumpListeners = new Set<TocJump>()

export function groupTocSections(headings: LexicalHeading[]): TocSection[] {
  const minLevel = headings.reduce(
    (lowest, heading) => Math.min(lowest, heading.level),
    6,
  )
  const sections: TocSection[] = []
  for (const heading of headings) {
    if (heading.level <= minLevel || sections.length === 0) {
      sections.push({ children: [], root: heading })
      continue
    }
    sections[sections.length - 1]?.children.push(heading)
  }
  return sections
}

export function estimateTocSheetHeight(headings: LexicalHeading[]): number {
  const sections = groupTocSections(headings)
  const rows = sections.reduce(
    (sum, section) =>
      sum + TOC_SHEET.rootRow + section.children.length * TOC_SHEET.childRow,
    0,
  )
  const gaps = Math.max(0, sections.length - 1) * TOC_SHEET.sectionGap
  return TOC_SHEET.header + rows + gaps + TOC_SHEET.bottom
}

export function estimateTocSheetDetents(
  headings: LexicalHeading[],
  windowHeight: number,
): number[] {
  const height = Math.max(1, windowHeight)
  const fraction = roundDetent(
    Math.min(
      TOC_SHEET.maxFirstFraction,
      Math.max(TOC_SHEET.minFraction, estimateTocSheetHeight(headings) / height),
    ),
  )
  const needsLarge = estimateTocSheetHeight(headings) / height > fraction + 0.04
  return needsLarge ? [fraction, 1] : [fraction]
}

export function presentArticleToc(
  headings: LexicalHeading[],
  windowHeight: number,
) {
  session = {
    detents: estimateTocSheetDetents(headings, windowHeight),
    headings,
  }
}

export function parseTocDetents(params: unknown): number[] {
  const raw =
    params && typeof params === 'object' && 'd' in params
      ? (params as { d?: string | string[] }).d
      : undefined
  const value = Array.isArray(raw) ? raw[0] : raw
  const parsed = value
    ?.split(',')
    .map(Number)
    .filter((n) => Number.isFinite(n) && n > 0 && n <= 1)
    .sort((a, b) => a - b)
  return parsed && parsed.length > 0 ? parsed : peekTocDetents()
}

export function tocHref(): Href {
  return `/toc?d=${peekTocDetents().join(',')}` as Href
}

export function peekTocSession() {
  return session
}

export function peekTocDetents() {
  return session?.detents ?? [0.42, 1]
}

export function subscribeTocJump(listener: TocJump) {
  jumpListeners.add(listener)
  return () => {
    jumpListeners.delete(listener)
  }
}

export function emitTocJump(blockId: string) {
  for (const listener of jumpListeners) listener(blockId)
}

function roundDetent(value: number) {
  return Math.round(value * 100) / 100
}
