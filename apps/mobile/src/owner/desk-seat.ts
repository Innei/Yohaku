import type { DeskApplication, DeskSnapshot } from './live-desk'

export function deskSeatKey(snapshot: DeskSnapshot): string | null {
  if (!snapshot.visible || snapshot.media || !snapshot.application) return null
  return snapshot.application.displayName
}

export function createSeatClock() {
  let seated: { at: number; key: string } | null = null

  return {
    elapsedMs(key: string | null, now: number): number | null {
      if (!key) {
        seated = null
        return null
      }
      if (!seated || seated.key !== key) {
        seated = { at: now, key }
        return 0
      }
      return Math.max(0, now - seated.at)
    },
  }
}

export function formatSeatElapsed(
  elapsedMs: number,
): { kind: 'just' } | { count: number; kind: 'hours' | 'minutes' } {
  if (elapsedMs < 60_000) return { kind: 'just' }
  const minutes = Math.floor(elapsedMs / 60_000)
  if (minutes < 60) return { kind: 'minutes', count: minutes }
  return { kind: 'hours', count: Math.floor(minutes / 60) }
}

export function seatRailPath(application: DeskApplication): string | null {
  const title = application.windowTitle
  if (!title || title === application.displayName) return null
  return title
}
