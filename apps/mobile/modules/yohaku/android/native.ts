import Storage from 'expo-sqlite/kv-store'
import * as WebBrowser from 'expo-web-browser'
import { Platform, ToastAndroid } from 'react-native'

import { createEmitter } from './emitter'
import { parseMarkdownToAstJson } from './markdown'

/**
 * Android implementation of the `Yohaku` Expo module surface defined in
 * `modules/yohaku/ios/YohakuModule.swift`.
 *
 * Everything that Apple implements with UIKit/AVFoundation/Keychain is backed
 * here by the closest Android-native counterpart:
 *   - Keychain            -> SQLite kv-store mirror (sync) for the session cookie
 *   - AVAudioPlayer(TTS)  -> expo-audio (ExoPlayer)
 *   - SFSafariViewController -> Custom Tabs via expo-web-browser
 *   - UIActivityViewController/PDFKit -> share sheet (see article-print-host)
 *   - UINotificationFeedbackGenerator -> ToastAndroid / expo-haptics at call sites
 *   - Mermaid / SVG WKWebView -> mermaid.ink + data URLs consumed by expo-image
 */

export type TtsRemoteAction = 'play' | 'pause' | 'stop'

export type YohakuNativeEvents = {
  onMeTabLongPress: () => void
  onTtsEnded: () => void
  onTtsError: (event: { message: string }) => void
  onTtsInterrupted: (event: { shouldResume: boolean }) => void
  onTtsRemote: (event: { action: TtsRemoteAction }) => void
  onTtsTime: (event: { duration: number; elapsed: number }) => void
}

export interface RichPrintPayload {
  exportPdf?: boolean
  items: unknown[]
  jobName: string
  klineColors: Record<'down' | 'grid' | 'label' | 'up' | 'volume', string>
  masthead: { meta: string; title: string; url: string }
  referer?: string
  siteName: string
  typography: Record<string, unknown>
}

/**
 * Keychain parity note: the iOS store is a synchronous Keychain wrapper and
 * `secretStore` (used by better-auth) is synchronous too. On Android we keep a
 * synchronous key/value mirror in SQLite for the session cookie, so a cold start
 * never loses it before the async path settles.
 */
const SECRET_PREFIX = 'yohaku.secret.'
const secureCache = new Map<string, string | null>()

function secretRead(key: string): string | null {
  if (secureCache.has(key)) return secureCache.get(key) ?? null
  try {
    const value = Storage.getItemSync(SECRET_PREFIX + key)
    secureCache.set(key, value)
    return value
  } catch {
    return null
  }
}

function secretWrite(key: string, value: string | null) {
  const safeKey = SECRET_PREFIX + key.replaceAll(/[^A-Za-z0-9._-]/g, '_')
  secureCache.set(key, value)
  try {
    if (value === null) Storage.removeItemSync(SECRET_PREFIX + key)
    else Storage.setItemSync(SECRET_PREFIX + key, value)
  } catch {
    // kv-store is best effort; the in-memory value stays authoritative.
  }
}

const emitter = createEmitter()

type AudioPlayerLike = ReturnType<
  typeof import('expo-audio').createAudioPlayer
>

let player: AudioPlayerLike | null = null
let playerSubscription: { remove: () => void } | null = null
let pendingRate = 1
let endedForUrl: string | null = null

async function ensureAudioMode() {
  const { setAudioModeAsync } = await import('expo-audio')
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: 'doNotMix',
  })
}

function bindPlayerStatus() {
  if (!player) return
  playerSubscription?.remove()
  playerSubscription = player.addListener('playbackStatusUpdate', (status) => {
    emitter.emit('onTtsTime', {
      duration: status.duration ?? 0,
      elapsed: status.currentTime ?? 0,
    })
    if (status.error) {
      emitter.emit('onTtsError', { message: status.error })
      return
    }
    if (status.didJustFinish) emitter.emit('onTtsEnded')
  })
}

async function loadTts(payload: {
  artist: string
  rate: number
  title: string
  url: string
}) {
  const { createAudioPlayer } = await import('expo-audio')
  await ensureAudioMode()
  pendingRate = payload.rate
  endedForUrl = null
  playerSubscription?.remove()
  playerSubscription = null
  player?.release()
  player = createAudioPlayer({ uri: payload.url }, { updateInterval: 300 })
  player.playbackRate = payload.rate
  player.loop = false
  bindPlayerStatus()
}

function withPlayer(action: (player: AudioPlayerLike) => void) {
  if (player) action(player)
}

function disposePlayer() {
  playerSubscription?.remove()
  playerSubscription = null
  player?.pause()
  player?.release()
  player = null
}

function measureNoteHeroText(title: string, meta: string, width: number) {
  // Mirrors the Swift measurement in YohakuModule.swift closely enough for the
  // shared-element hero to reserve the same vertical band on Android.
  const usable = Math.max(160, width - 40)
  const titleSize = 30
  const titleLine = 38
  const perLine = Math.max(6, Math.floor(usable / (titleSize * 0.62)))
  const lines = Math.max(1, Math.ceil(title.length / perLine))
  const metaHeight = meta ? 22 : 0
  return Math.round(28 + lines * titleLine + metaHeight + 40)
}

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** Hermes has no btoa/TextEncoder guarantee, so encode UTF-8 by hand. */
function utf8Bytes(input: string): number[] {
  const out: number[] = []
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index)
    if (code < 0x80) out.push(code)
    else if (code < 0x800) out.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code >= 0xd800 && code < 0xdc00) {
      const low = input.charCodeAt((index += 1))
      const point = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00)
      out.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      )
    } else {
      out.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    }
  }
  return out
}

function base64(input: string): string {
  const bytes = utf8Bytes(input)
  let out = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index]!
    const b = bytes[index + 1]
    const c = bytes[index + 2]
    out += BASE64_ALPHABET[a >> 2]
    out += BASE64_ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)]
    out += b === undefined ? '=' : BASE64_ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)]
    out += c === undefined ? '=' : BASE64_ALPHABET[c & 63]
  }
  return out
}

export const YohakuNative = {
  addListener<K extends keyof YohakuNativeEvents>(
    eventName: K,
    listener: YohakuNativeEvents[K],
  ) {
    return emitter.addListener(eventName, listener as (payload: any) => void)
  },

  async circularImageUri(url: string) {
    return {
      height: 0,
      scale: 1,
      uri: url,
      width: 0,
    }
  },

  async configureCompactNativeTabBar() {},

  databaseBytes() {
    try {
      const rows = Storage.getItemSync('__db_size__')
      return rows ? Number(rows) || 0 : 0
    } catch {
      return 0
    }
  },

  async dismissAuthSession() {
    await WebBrowser.dismissBrowser()
  },

  async downloadSystemFont(_postScriptName: string) {
    return false
  },

  liquidGlassAvailable: false,

  async loadTts(payload: {
    artist: string
    rate: number
    title: string
    url: string
  }) {
    await loadTts(payload)
  },

  measureNoteHeroText,

  async openAuthSession(url: string, scheme: string) {
    const result = await WebBrowser.openAuthSessionAsync(url, `${scheme}://`)
    if (result.type === 'success') return { type: 'success' as const, url: result.url }
    return { type: 'cancel' as const }
  },

  /** Same JSON AST contract as the Swift Markdown parser. */
  parseMarkdown(markdown: string) {
    return parseMarkdownToAstJson(markdown)
  },

  async pauseTts() {
    withPlayer((p) => p.pause())
  },

  async playTts() {
    await ensureAudioMode()
    withPlayer((p) => {
      if (p.playbackRate !== pendingRate) p.playbackRate = pendingRate
      p.play()
    })
  },

  async preloadTts(url: string) {
    try {
      const { preload } = await import('expo-audio')
      await preload({ uri: url })
    } catch {
      // Preloading is an optimisation; playback still works without it.
    }
  },

  prepareNoteHeroTransition(_noteId: string) {},

  async presentSafari(url: string) {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    })
  },

  async printRichDocument(_payload: RichPrintPayload) {
    // Android has no PDFKit equivalent wired into this port yet; the share
    // sheet path in article-more handles the fallback URL for us.
    return ''
  },

  async rasterizeSvg(payload: {
    bg: string
    height: number
    svg: string
    width: number
  }) {
    return {
      height: payload.height,
      uri: `data:image/svg+xml;base64,${base64(payload.svg)}`,
      width: payload.width,
    }
  },

  async renderMermaid(payload: {
    bg: string
    fg: string
    source: string
  }) {
    // mermaid.ink rasterises the diagram server-side; the SVG viewBox gives us
    // the natural size that the WKWebView snapshot reported on iOS.
    const encoded = encodeBase64Url(payload.source)
    const bg = payload.bg.replace('#', '')
    const uri = `https://mermaid.ink/img/${encoded}?bgColor=${encodeURIComponent(bg)}`
    let width = 0
    let height = 0
    try {
      const response = await fetch(
        `https://mermaid.ink/svg/${encoded}?bgColor=${encodeURIComponent(bg)}`,
      )
      const svg = await response.text()
      const viewBox = /viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/.exec(svg)
      if (viewBox) {
        width = Math.round(Number(viewBox[1]))
        height = Math.round(Number(viewBox[2]))
      }
    } catch {
      // Offline: the image view falls back to a 2:1 plate.
    }
    return { height, uri, width }
  },

  secretDelete(key: string) {
    secretWrite(key, null)
  },

  secretGet(key: string): string | null {
    return secretRead(key)
  },

  secretSet(key: string, value: string) {
    secretWrite(key, value)
  },

  async setRestorableRoute(_routeURL: string) {},

  async setTtsRate(rate: number) {
    pendingRate = rate
    withPlayer((p) => {
      p.playbackRate = rate
    })
  },

  showToast(message: string) {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT)
    }
  },

  async stopTts() {
    disposePlayer()
    endedForUrl = null
  },
}

function encodeBase64Url(input: string): string {
  return base64(input).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export const YohakuMembershipNative = {
  addListener(_event: string, _listener: (payload: any) => void) {
    return { remove() {} }
  },
  async currentEntitlementJws() {
    return []
  },
  async finishMembershipTransaction(_signedTransactionInfo: string) {},
  async presentSubscriptionStore() {
    return { status: 'cancelled' as const }
  },
  async showManageSubscriptions() {},
  async unfinishedMembershipTransactionJws() {
    return []
  },
}
