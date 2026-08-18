import { describe, expect, it } from 'vitest'

import type { DeskMedia } from './live-desk'
import {
  buildMediaByline,
  parseDeskSnapshot,
  projectMediaPositionMs,
} from './live-desk'

const NOW = Date.parse('2026-08-16T12:00:00.000Z')

const activeState = (projection: Record<string, unknown>) => ({
  schemaVersion: 2,
  projection: {
    availability: 'active',
    expiresAt: '2026-08-16T12:05:00.000Z',
    updatedAt: '2026-08-16T11:59:00.000Z',
    application: null,
    media: null,
    ...projection,
  },
})

const media = (overrides: Record<string, unknown> = {}) => ({
  album: 'One Last Kiss EP',
  artist: '宇多田ヒカル',
  artwork: { url: 'https://cdn/artwork.jpg' },
  kind: 'music',
  player: { displayName: 'Apple Music' },
  sessionId: 's1',
  title: 'One Last Kiss',
  playback: {
    anchorAt: '2026-08-16T11:59:30.000Z',
    durationMs: 251_000,
    positionMs: 60_000,
    rate: 1,
    state: 'playing',
  },
  ...overrides,
})

describe('parseDeskSnapshot', () => {
  it('hides for missing, idle, or expired projections', () => {
    expect(parseDeskSnapshot(undefined, NOW).visible).toBe(false)
    expect(parseDeskSnapshot({ projection: null }, NOW).visible).toBe(false)
    expect(
      parseDeskSnapshot(activeState({ availability: 'idle' }), NOW).visible,
    ).toBe(false)
    expect(
      parseDeskSnapshot(
        activeState({ expiresAt: '2026-08-16T11:00:00.000Z' }),
        NOW,
      ).visible,
    ).toBe(false)
    expect(parseDeskSnapshot(activeState({}), NOW).visible).toBe(false)
  })

  it('extracts the application with custom label over window title', () => {
    const snapshot = parseDeskSnapshot(
      activeState({
        application: {
          activity: { customLabel: '  writing Yohaku  ', key: null },
          displayName: 'Xcode',
          icon: { url: 'https://cdn/xcode.png' },
          window: { title: 'post-detail.tsx' },
        },
      }),
      NOW,
    )
    expect(snapshot).toMatchObject({
      application: {
        detail: 'writing Yohaku',
        displayName: 'Xcode',
        iconUrl: 'https://cdn/xcode.png',
      },
      media: null,
      visible: true,
    })
  })

  it('extracts playing media with trimmed text fields', () => {
    const snapshot = parseDeskSnapshot(
      activeState({ media: media({ title: '  One Last Kiss  ' }) }),
      NOW,
    )
    expect(snapshot).toMatchObject({
      media: {
        artist: '宇多田ヒカル',
        artworkUrl: 'https://cdn/artwork.jpg',
        durationMs: 251_000,
        playbackState: 'playing',
        playbackUrl: null,
        playerDisplayName: 'Apple Music',
        title: 'One Last Kiss',
      },
      visible: true,
    })
  })

  it('keeps a canonical QQ or NetEase song link and drops unknown hosts', () => {
    const qq = 'https://y.qq.com/n/ryqq/songDetail/001lzbAN14boA4'
    const snapshot = parseDeskSnapshot(
      activeState({ media: media({ link: { url: qq } }) }),
      NOW,
    )
    expect(snapshot.visible && snapshot.media?.playbackUrl).toBe(qq)

    const unknown = parseDeskSnapshot(
      activeState({
        media: media({ link: { url: 'https://music.apple.com/song/1' } }),
      }),
      NOW,
    )
    expect(unknown.visible && unknown.media?.playbackUrl).toBeNull()
  })

  it('drops media without a usable playback block', () => {
    const snapshot = parseDeskSnapshot(
      activeState({ media: media({ playback: null }) }),
      NOW,
    )
    expect(snapshot.visible).toBe(false)
  })
})

describe('projectMediaPositionMs', () => {
  const base: DeskMedia = {
    album: null,
    anchorAt: '2026-08-16T11:59:30.000Z',
    artist: null,
    artworkUrl: null,
    durationMs: 251_000,
    playbackState: 'playing',
    playbackUrl: null,
    playerDisplayName: null,
    positionMs: 60_000,
    rate: 1,
    title: null,
  }

  it('advances playing media from its anchor', () => {
    expect(projectMediaPositionMs(base, NOW)).toBe(90_000)
  })

  it('freezes paused media and clamps to duration', () => {
    expect(
      projectMediaPositionMs({ ...base, playbackState: 'paused' }, NOW),
    ).toBe(60_000)
    expect(projectMediaPositionMs({ ...base, positionMs: 250_000 }, NOW)).toBe(
      251_000,
    )
  })

  it('returns null without a position', () => {
    expect(projectMediaPositionMs({ ...base, positionMs: null }, NOW)).toBe(
      null,
    )
  })
})

describe('buildMediaByline', () => {
  it('joins artist and album, skipping duplicates of the title', () => {
    expect(
      buildMediaByline({
        album: 'One Last Kiss',
        artist: '宇多田ヒカル',
        title: 'One Last Kiss',
      }),
    ).toBe('宇多田ヒカル')
    expect(
      buildMediaByline({
        album: 'Fantôme',
        artist: '宇多田ヒカル',
        title: '道',
      }),
    ).toBe('宇多田ヒカル · Fantôme')
    expect(buildMediaByline({ album: null, artist: null, title: null })).toBe(
      null,
    )
  })
})
