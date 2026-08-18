export type MusicProvider = 'netease' | 'qq'

export type MusicPlaybackTarget = {
  httpsUrl: string
  provider: MusicProvider
  schemePrefix: string
  schemeUrl: string
}

export type MusicLinking = {
  canOpenURL: (url: string) => Promise<boolean>
  openURL: (url: string) => Promise<unknown>
}

const QQ_SONG = /^\/n\/ryqq\/songDetail\/([\dA-Za-z]{14})$/
const NETEASE_ID = /^(?!0$)\d{1,20}$/

export function musicPlaybackTarget(url: string): MusicPlaybackTarget | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:' || parsed.port || parsed.hash) return null

  if (parsed.hostname === 'y.qq.com') {
    const match = parsed.pathname.match(QQ_SONG)
    if (!match || parsed.search) return null
    const songmid = match[1]
    return {
      httpsUrl: url,
      provider: 'qq',
      schemePrefix: 'qqmusic://',
      schemeUrl: `qqmusic://qq.com/media/playSonglist?p=${encodeURIComponent(
        JSON.stringify({ song: [{ songmid }], action: 'play' }),
      )}`,
    }
  }

  if (parsed.hostname === 'music.163.com') {
    const parameters = Array.from(parsed.searchParams.entries())
    const id = parameters[0]?.[1]
    if (
      parsed.pathname !== '/song' ||
      parameters.length !== 1 ||
      parameters[0]?.[0] !== 'id' ||
      !id ||
      !NETEASE_ID.test(id)
    ) {
      return null
    }
    return {
      httpsUrl: url,
      provider: 'netease',
      schemePrefix: 'orpheus://',
      schemeUrl: `orpheus://song/${id}`,
    }
  }

  return null
}

export async function openMusicPlayback(
  url: string,
  linking: MusicLinking,
): Promise<void> {
  const target = musicPlaybackTarget(url)
  if (!target) {
    await linking.openURL(url)
    return
  }
  if (await linking.canOpenURL(target.schemePrefix)) {
    await linking.openURL(target.schemeUrl)
    return
  }
  await linking.openURL(target.httpsUrl)
}
