import { describe, expect, it } from 'vitest'

import {
  createSeatClock,
  deskSeatKey,
  formatSeatElapsed,
  seatRailPath,
} from './desk-seat'
import type { DeskSnapshot } from './live-desk'

const using = (
  application: {
    detail?: string | null
    displayName: string
    windowTitle?: string | null
  },
  media: DeskSnapshot extends { visible: true } ? DeskSnapshot['media'] : never = null,
): DeskSnapshot => ({
  application: {
    detail: application.detail ?? null,
    displayName: application.displayName,
    iconUrl: null,
    windowTitle: application.windowTitle ?? null,
  },
  media,
  visible: true,
})

describe('deskSeatKey', () => {
  it('is the app name only when the desk is application-only', () => {
    expect(deskSeatKey({ visible: false })).toBeNull()
    expect(deskSeatKey(using({ displayName: 'Xcode' }))).toBe('Xcode')
    expect(
      deskSeatKey(
        using({ displayName: 'Xcode' }, {
          album: null,
          anchorAt: '2026-08-16T11:59:30.000Z',
          artist: null,
          artworkUrl: null,
          durationMs: 1,
          playbackState: 'playing',
          playbackUrl: null,
          playerDisplayName: null,
          positionMs: 0,
          rate: 1,
          title: 'One Last Kiss',
        }),
      ),
    ).toBeNull()
  })
})

describe('createSeatClock', () => {
  it('starts when an identity appears and resets when it changes', () => {
    const clock = createSeatClock()
    expect(clock.elapsedMs(null, 1000)).toBeNull()
    expect(clock.elapsedMs('Xcode', 5000)).toBe(0)
    expect(clock.elapsedMs('Xcode', 65_000)).toBe(60_000)
    expect(clock.elapsedMs('Cursor', 80_000)).toBe(0)
    expect(clock.elapsedMs('Cursor', 90_000)).toBe(10_000)
    expect(clock.elapsedMs(null, 100_000)).toBeNull()
  })
})

describe('formatSeatElapsed', () => {
  it('uses just-sat, then minutes, then hours', () => {
    expect(formatSeatElapsed(12_000)).toEqual({ kind: 'just' })
    expect(formatSeatElapsed(60_000)).toEqual({ kind: 'minutes', count: 1 })
    expect(formatSeatElapsed(14 * 60_000)).toEqual({
      kind: 'minutes',
      count: 14,
    })
    expect(formatSeatElapsed(2 * 3600_000)).toEqual({ kind: 'hours', count: 2 })
  })
})

describe('seatRailPath', () => {
  it('keeps a window title that is not the app name', () => {
    expect(
      seatRailPath({
        detail: 'writing Yohaku',
        displayName: 'Xcode',
        iconUrl: null,
        windowTitle: 'desk-card.tsx',
      }),
    ).toBe('desk-card.tsx')
    expect(
      seatRailPath({
        detail: null,
        displayName: 'Xcode',
        iconUrl: null,
        windowTitle: 'Xcode',
      }),
    ).toBeNull()
    expect(
      seatRailPath({
        detail: null,
        displayName: 'Xcode',
        iconUrl: null,
        windowTitle: null,
      }),
    ).toBeNull()
  })
})
