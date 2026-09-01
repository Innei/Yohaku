import type { Locale } from '@/i18n/config'

import {
  noteListEstimatedHeight,
  noteYearItemId,
} from './flatten-notes-list'

export const fabricRail = {
  compactWidth: 36,
  expandedWidth: 88,
  snapThreshold: 0.5,
  /** Progress-units per second. A leftward flick above this opens. */
  flingVelocity: 1.6,
} as const

export type FabricDensity = 'compact' | 'expanded'

export type FabricRailMark = {
  compactT: number
  expandedT: number
  id: string
  itemId: string
  kind: 'note' | 'year'
  label: string
  parentItemId: string
  year: number
}

export type FabricRailGroup = {
  notes: { createdAt: Date; id: string }[]
  year: number
}

export function clampFabricProgress(progress: number): number {
  if (progress <= 0) return 0
  if (progress >= 1) return 1
  return progress
}

export function fabricTargetProgress(density: FabricDensity): number {
  return density === 'expanded' ? 1 : 0
}

export function fabricTravel(
  compactWidth = fabricRail.compactWidth,
  expandedWidth = fabricRail.expandedWidth,
): number {
  return Math.max(1, expandedWidth - compactWidth)
}

/**
 * 1:1 mapping: the rail’s inner edge sits under the finger.
 * `fingerX` is measured from the list’s left; `listWidth` is the full width.
 */
export function fabricProgressFromFingerX({
  compactWidth = fabricRail.compactWidth,
  expandedWidth = fabricRail.expandedWidth,
  fingerX,
  listWidth,
}: {
  compactWidth?: number
  expandedWidth?: number
  fingerX: number
  listWidth: number
}): number {
  const compactLeft = listWidth - compactWidth
  const expandedLeft = listWidth - expandedWidth
  const span = compactLeft - expandedLeft
  if (span <= 0) return 0
  return clampFabricProgress((compactLeft - fingerX) / span)
}

export function fabricProgressVelocity(
  velocityX: number,
  travel = fabricTravel(),
): number {
  return -velocityX / travel
}

export function snapFabricProgress(
  progress: number,
  velocityProgress = 0,
  threshold = fabricRail.snapThreshold,
  flingVelocity = fabricRail.flingVelocity,
): FabricDensity {
  if (velocityProgress >= flingVelocity) return 'expanded'
  if (velocityProgress <= -flingVelocity) return 'compact'
  return clampFabricProgress(progress) >= threshold ? 'expanded' : 'compact'
}

export function interpolateFabricMarkT(
  mark: Pick<FabricRailMark, 'compactT' | 'expandedT'>,
  progress: number,
): number {
  const t = clampFabricProgress(progress)
  return mark.compactT + (mark.expandedT - mark.compactT) * t
}

const fabricWeekdayFormatters = new Map<
  Locale,
  { day: Intl.DateTimeFormat; weekday: Intl.DateTimeFormat }
>()

const fabricIntlLocales: Record<Locale, string> = {
  zh: 'zh-Hans',
  'zh-TW': 'zh-Hant',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
}

function fabricDateFormatters(locale: Locale) {
  const cached = fabricWeekdayFormatters.get(locale)
  if (cached) return cached
  const loc = fabricIntlLocales[locale]
  const next = {
    day: new Intl.DateTimeFormat(loc, { day: 'numeric' }),
    weekday: new Intl.DateTimeFormat(loc, { weekday: 'short' }),
  }
  fabricWeekdayFormatters.set(locale, next)
  return next
}

export function formatFabricRailDate(date: Date, locale: Locale): string {
  const { day, weekday } = fabricDateFormatters(locale)
  return `${day.format(date)} ${weekday.format(date)}`
}

export function formatFabricRailYear(year: number): string {
  return String(year)
}

export function buildFabricRailMarks({
  formatNoteLabel,
  groups,
}: {
  formatNoteLabel: (date: Date) => string
  groups: FabricRailGroup[]
}): FabricRailMark[] {
  const totalNotes = groups.reduce((sum, group) => sum + group.notes.length, 0)
  if (totalNotes === 0) return []

  const expandedWeight = groups.reduce((sum, group) => {
    return (
      sum +
      noteListEstimatedHeight.year +
      group.notes.length * noteListEstimatedHeight.note
    )
  }, 0)

  const marks: FabricRailMark[] = []
  let notesBefore = 0
  let expandedCursor = 0

  for (const group of groups) {
    const yearId = noteYearItemId(group.year)
    const compactT = notesBefore / totalNotes
    const expandedT =
      expandedWeight === 0 ? 0 : expandedCursor / expandedWeight

    marks.push({
      compactT,
      expandedT,
      id: yearId,
      itemId: yearId,
      kind: 'year',
      label: formatFabricRailYear(group.year),
      parentItemId: yearId,
      year: group.year,
    })

    expandedCursor += noteListEstimatedHeight.year

    group.notes.forEach((note, index) => {
      const noteCompactT = (notesBefore + index + 0.5) / totalNotes
      const noteExpandedT =
        expandedWeight === 0 ? 0 : expandedCursor / expandedWeight
      marks.push({
        compactT: noteCompactT,
        expandedT: noteExpandedT,
        id: note.id,
        itemId: note.id,
        kind: 'note',
        label: formatNoteLabel(note.createdAt),
        parentItemId: yearId,
        year: group.year,
      })
      expandedCursor += noteListEstimatedHeight.note
    })

    notesBefore += group.notes.length
  }

  return marks
}
