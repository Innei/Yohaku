import { describe, expect, it, vi } from 'vitest'

import {
  musicPlaybackTarget,
  openMusicPlayback,
  type MusicLinking,
} from './music-playback'

const QQ_HTTPS = 'https://y.qq.com/n/ryqq/songDetail/001lzbAN14boA4'
const NETEASE_HTTPS = 'https://music.163.com/song?id=3339827986'

function qqScheme(songmid: string) {
  return `qqmusic://qq.com/media/playSonglist?p=${encodeURIComponent(
    JSON.stringify({ song: [{ songmid }], action: 'play' }),
  )}`
}

describe('musicPlaybackTarget', () => {
  it('maps a canonical QQ Music song URL to the native scheme', () => {
    expect(musicPlaybackTarget(QQ_HTTPS)).toEqual({
      httpsUrl: QQ_HTTPS,
      provider: 'qq',
      schemePrefix: 'qqmusic://',
      schemeUrl: qqScheme('001lzbAN14boA4'),
    })
  })

  it('maps a canonical NetEase song URL to the native scheme', () => {
    expect(musicPlaybackTarget(NETEASE_HTTPS)).toEqual({
      httpsUrl: NETEASE_HTTPS,
      provider: 'netease',
      schemePrefix: 'orpheus://',
      schemeUrl: 'orpheus://song/3339827986',
    })
  })

  it('rejects spoofed hosts, extra query, and unknown URLs', () => {
    expect(
      musicPlaybackTarget(
        'https://y.qq.com.example.com/n/ryqq/songDetail/001lzbAN14boA4',
      ),
    ).toBeNull()
    expect(
      musicPlaybackTarget(
        'https://y.qq.com/n/ryqq/songDetail/001lzbAN14boA4?from=share',
      ),
    ).toBeNull()
    expect(
      musicPlaybackTarget('https://music.163.com/song?id=3339827986&out=1'),
    ).toBeNull()
    expect(musicPlaybackTarget('https://music.apple.com/song/1')).toBeNull()
    expect(musicPlaybackTarget('not a url')).toBeNull()
  })
})

describe('openMusicPlayback', () => {
  it('opens the native scheme when the app is installed', async () => {
    const linking = fakeLinking({ 'qqmusic://': true })
    await openMusicPlayback(QQ_HTTPS, linking)
    expect(linking.openURL).toHaveBeenCalledWith(qqScheme('001lzbAN14boA4'))
  })

  it('falls back to https when the app is not installed', async () => {
    const linking = fakeLinking({ 'orpheus://': false })
    await openMusicPlayback(NETEASE_HTTPS, linking)
    expect(linking.openURL).toHaveBeenCalledWith(NETEASE_HTTPS)
  })
})

function fakeLinking(canOpen: Record<string, boolean>): MusicLinking & {
  openURL: ReturnType<typeof vi.fn>
} {
  return {
    canOpenURL: async (url: string) => canOpen[url] ?? false,
    openURL: vi.fn(async () => true),
  }
}
