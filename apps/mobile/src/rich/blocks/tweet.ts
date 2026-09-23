export interface TweetEntityRange {
  end: number
  href: string
  start: number
  type: 'hashtag' | 'link' | 'mention'
}

export interface TweetMedia {
  height: number
  kind: 'gif' | 'photo' | 'video'
  url: string
  videoUrl?: string
  width: number
}

export interface ParsedTweet {
  createdAt: string
  entities: TweetEntityRange[]
  id: string
  likes?: number
  media: TweetMedia[]
  quoted?: ParsedTweet
  replies?: number
  replyTo?: { screenName: string; statusId: string }
  text: string
  user: { avatar: string; name: string; screenName: string; verified: boolean }
}

export function tweetIdFromUrl(url: string): string | null {
  let pathname: string
  try {
    pathname = new URL(url).pathname
  } catch {
    return null
  }
  const digitSegments = pathname
    .split('/')
    .filter((segment) => /^\d+$/.test(segment))
  return digitSegments.length > 0 ? (digitSegments.at(-1) ?? null) : null
}

export function tweetToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(6 ** 2)
    .replaceAll(/(0+|\.)/g, '')
}

export function formatTweetDate(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  const day = `${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  return date.getFullYear() === now.getFullYear()
    ? day
    : `${date.getFullYear()}年${day}`
}

export function formatTweetCount(count: number): string {
  if (count > 999_999) return `${(count / 1_000_000).toFixed(1)}M`
  if (count > 999) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value : []
}

function mp4Url(detail: Record<string, unknown>): string | undefined {
  const info = detail.video_info as Record<string, unknown> | undefined
  const mp4s = toArray(info?.variants)
    .filter((variant) => variant.content_type === 'video/mp4')
    .sort((a, b) => ((b.bitrate as number) ?? 0) - ((a.bitrate as number) ?? 0))
  const pick = mp4s.length > 1 ? mp4s[1] : mp4s[0]
  return typeof pick?.url === 'string' ? pick.url : undefined
}

function parseMedia(data: Record<string, unknown>): TweetMedia[] {
  const details = toArray(data.mediaDetails)
  if (details.length === 0) {
    return toArray(data.photos)
      .filter((photo) => typeof photo.url === 'string')
      .map((photo) => ({
        kind: 'photo' as const,
        url: photo.url as string,
        width: photo.width as number,
        height: photo.height as number,
      }))
  }
  const media: TweetMedia[] = []
  for (const detail of details) {
    const info = detail.original_info as Record<string, unknown> | undefined
    const url = detail.media_url_https
    if (typeof url !== 'string' || !info) continue
    const size = { width: info.width as number, height: info.height as number }
    if (detail.type === 'photo') {
      media.push({ kind: 'photo', url, ...size })
      continue
    }
    const videoUrl = mp4Url(detail)
    if (!videoUrl) continue
    media.push({
      kind: detail.type === 'animated_gif' ? 'gif' : 'video',
      url,
      videoUrl,
      ...size,
    })
  }
  return media
}

export function parseTweet(json: unknown, depth = 0): ParsedTweet | null {
  if (!json || typeof json !== 'object') return null
  const data = json as Record<string, unknown>
  if (data.__typename === 'TweetTombstone') return null

  const id = data.id_str
  const text = data.text
  const createdAt = data.created_at
  const user = data.user as Record<string, unknown> | undefined
  if (
    typeof id !== 'string' ||
    typeof text !== 'string' ||
    typeof createdAt !== 'string' ||
    !user ||
    typeof user.name !== 'string' ||
    typeof user.screen_name !== 'string' ||
    typeof user.profile_image_url_https !== 'string'
  ) {
    return null
  }

  const entitiesJson = data.entities as Record<string, unknown> | undefined
  const displayRange = data.display_text_range as [number, number] | undefined
  const codePoints = Array.from(text)
  const rangeStart = displayRange?.[0] ?? 0
  const trimEnd = displayRange?.[1] ?? codePoints.length
  const trimmedText = codePoints.slice(rangeStart, trimEnd).join('').trimEnd()

  const entities: TweetEntityRange[] = []
  for (const hashtag of toArray(entitiesJson?.hashtags)) {
    const [start, end] = hashtag.indices as [number, number]
    if (start < rangeStart || end > trimEnd) continue
    entities.push({
      type: 'hashtag',
      start: start - rangeStart,
      end: end - rangeStart,
      href: `https://x.com/hashtag/${hashtag.text as string}`,
    })
  }
  for (const mention of toArray(entitiesJson?.user_mentions)) {
    const [start, end] = mention.indices as [number, number]
    if (start < rangeStart || end > trimEnd) continue
    entities.push({
      type: 'mention',
      start: start - rangeStart,
      end: end - rangeStart,
      href: `https://x.com/${mention.screen_name as string}`,
    })
  }
  for (const link of toArray(entitiesJson?.urls)) {
    const [start, end] = link.indices as [number, number]
    if (start < rangeStart || end > trimEnd) continue
    entities.push({
      type: 'link',
      start: start - rangeStart,
      end: end - rangeStart,
      href: link.expanded_url as string,
    })
  }
  entities.sort((a, b) => a.start - b.start)

  const media = parseMedia(data)
  const quoted =
    depth === 0 && data.quoted_tweet
      ? (parseTweet(data.quoted_tweet, 1) ?? undefined)
      : undefined
  const replyTo =
    typeof data.in_reply_to_screen_name === 'string' &&
    typeof data.in_reply_to_status_id_str === 'string'
      ? {
          screenName: data.in_reply_to_screen_name,
          statusId: data.in_reply_to_status_id_str,
        }
      : undefined
  const replies = data.conversation_count ?? data.reply_count

  return {
    id,
    text: trimmedText,
    entities,
    user: {
      name: user.name,
      screenName: user.screen_name,
      avatar: user.profile_image_url_https,
      verified: user.is_blue_verified === true,
    },
    createdAt,
    media,
    quoted,
    replyTo,
    likes:
      typeof data.favorite_count === 'number' ? data.favorite_count : undefined,
    replies: typeof replies === 'number' ? replies : undefined,
  }
}
