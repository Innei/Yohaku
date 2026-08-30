import { musicPlaybackTarget } from './music-playback'

export interface DeskApplication {
  detail: string | null
  displayName: string
  iconUrl: string | null
  windowTitle: string | null
}

export interface DeskMedia {
  album: string | null
  anchorAt: string
  artist: string | null
  artworkUrl: string | null
  durationMs: number | null
  playbackState: 'paused' | 'playing'
  playbackUrl: string | null
  playerDisplayName: string | null
  positionMs: number | null
  rate: number
  title: string | null
}

export type DeskSnapshot =
  | { visible: false }
  | {
      application: DeskApplication | null
      media: DeskMedia | null
      visible: true
    }

const HIDDEN: DeskSnapshot = { visible: false }

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

function url(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  return text((value as { url?: unknown }).url)
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseApplication(raw: unknown): DeskApplication | null {
  if (!raw || typeof raw !== 'object') return null
  const app = raw as {
    activity?: { customLabel?: unknown } | null
    displayName?: unknown
    icon?: unknown
    window?: { title?: unknown } | null
  }
  const displayName = text(app.displayName)
  if (!displayName) return null
  return {
    detail: text(app.activity?.customLabel),
    displayName,
    iconUrl: url(app.icon),
    windowTitle: text(app.window?.title),
  }
}

function parseMedia(raw: unknown): DeskMedia | null {
  if (!raw || typeof raw !== 'object') return null
  const media = raw as {
    album?: unknown
    artist?: unknown
    artwork?: unknown
    link?: unknown
    playback?: {
      anchorAt?: unknown
      durationMs?: unknown
      positionMs?: unknown
      rate?: unknown
      state?: unknown
    } | null
    player?: { displayName?: unknown } | null
    title?: unknown
  }
  const playback = media.playback
  if (!playback || typeof playback !== 'object') return null
  const anchorAt = text(playback.anchorAt)
  const state = playback.state
  if (!anchorAt || (state !== 'playing' && state !== 'paused')) return null
  const href = url(media.link)
  return {
    album: text(media.album),
    anchorAt,
    artist: text(media.artist),
    artworkUrl: url(media.artwork),
    durationMs: numberOrNull(playback.durationMs),
    playbackState: state,
    playbackUrl: href && musicPlaybackTarget(href) ? href : null,
    playerDisplayName: text(media.player?.displayName),
    positionMs: numberOrNull(playback.positionMs),
    rate: numberOrNull(playback.rate) ?? 1,
    title: text(media.title),
  }
}

export function parseDeskSnapshot(raw: unknown, now: number): DeskSnapshot {
  if (!raw || typeof raw !== 'object') return HIDDEN
  const projection = (raw as { projection?: unknown }).projection
  if (!projection || typeof projection !== 'object') return HIDDEN
  const { availability, expiresAt } = projection as {
    availability?: unknown
    expiresAt?: unknown
  }
  if (availability !== 'active') return HIDDEN
  if (typeof expiresAt !== 'string' || Date.parse(expiresAt) <= now) {
    return HIDDEN
  }

  const application = parseApplication(
    (projection as { application?: unknown }).application,
  )
  const media = parseMedia((projection as { media?: unknown }).media)
  if (!application && !media) return HIDDEN
  return { application, media, visible: true }
}

export function projectMediaPositionMs(
  media: DeskMedia,
  now: number,
): number | null {
  if (media.positionMs === null) return null
  const elapsedMs = Math.max(0, now - Date.parse(media.anchorAt))
  const projected =
    media.playbackState === 'playing'
      ? media.positionMs + elapsedMs * media.rate
      : media.positionMs
  return Math.round(
    media.durationMs === null
      ? Math.max(0, projected)
      : Math.min(media.durationMs, Math.max(0, projected)),
  )
}

const STALE_ZERO_MS = 5_000
const REGRESSION_MS = 2_000

function sameTrack(left: DeskMedia, right: DeskMedia): boolean {
  return (
    left.title === right.title &&
    left.artist === right.artist &&
    left.playerDisplayName === right.playerDisplayName &&
    left.durationMs === right.durationMs
  )
}

// QQ Music often re-reports ~0.4s and the server rebases anchorAt on every
// poll. Keep the local playhead unless the incoming position looks like a
// real seek. ponytail: seek-to-start is treated as stale; add a session
// fingerprint if that starts mattering.
export function holdMediaPlayhead(
  previous: DeskMedia | null,
  incoming: DeskMedia,
  now: number,
): DeskMedia {
  if (!previous || !sameTrack(previous, incoming)) return incoming

  const incomingPos = projectMediaPositionMs(incoming, now)
  const previousPos = projectMediaPositionMs(previous, now)
  if (incomingPos === null || previousPos === null) return incoming
  if (incomingPos + REGRESSION_MS >= previousPos || incomingPos >= STALE_ZERO_MS) {
    return incoming
  }

  return {
    ...incoming,
    anchorAt: new Date(now).toISOString(),
    positionMs: previousPos,
  }
}

export function buildMediaByline(
  media: Pick<DeskMedia, 'album' | 'artist' | 'title'>,
): string | null {
  const artist = media.title ? media.artist : null
  const album =
    media.album && media.album !== media.title && media.album !== media.artist
      ? media.album
      : null
  return [artist, album].filter(Boolean).join(' · ') || null
}
