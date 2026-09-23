export interface TweetEntityRange {
  end: number
  href: string
  start: number
  type: 'hashtag' | 'link' | 'mention'
}

export interface ParsedTweet {
  createdAt: string
  entities: TweetEntityRange[]
  id: string
  photo?: { height: number; url: string; width: number }
  text: string
  user: { avatar: string; name: string; screenName: string }
  videoPoster?: { height: number; url: string; width: number }
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

export function formatTweetDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value : []
}

export function parseTweet(json: unknown): ParsedTweet | null {
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
  const trimEnd = displayRange?.[1] ?? codePoints.length
  const trimmedText = codePoints.slice(0, trimEnd).join('')

  const entities: TweetEntityRange[] = []
  for (const hashtag of toArray(entitiesJson?.hashtags)) {
    const [start, end] = hashtag.indices as [number, number]
    if (end > trimEnd) continue
    entities.push({
      type: 'hashtag',
      start,
      end,
      href: `https://x.com/hashtag/${hashtag.text as string}`,
    })
  }
  for (const mention of toArray(entitiesJson?.user_mentions)) {
    const [start, end] = mention.indices as [number, number]
    if (end > trimEnd) continue
    entities.push({
      type: 'mention',
      start,
      end,
      href: `https://x.com/${mention.screen_name as string}`,
    })
  }
  for (const link of toArray(entitiesJson?.urls)) {
    const [start, end] = link.indices as [number, number]
    if (end > trimEnd) continue
    entities.push({
      type: 'link',
      start,
      end,
      href: link.expanded_url as string,
    })
  }
  entities.sort((a, b) => a.start - b.start)

  const photos = data.photos as Array<Record<string, unknown>> | undefined
  const photo = photos?.[0]
    ? {
        url: photos[0].url as string,
        width: photos[0].width as number,
        height: photos[0].height as number,
      }
    : undefined

  const video = data.video as Record<string, unknown> | undefined
  const videoAspect = video?.aspectRatio as [number, number] | undefined
  const videoPoster =
    video && typeof video.poster === 'string' && videoAspect
      ? { url: video.poster, width: videoAspect[0], height: videoAspect[1] }
      : undefined

  return {
    id,
    text: trimmedText,
    entities,
    user: {
      name: user.name,
      screenName: user.screen_name,
      avatar: user.profile_image_url_https,
    },
    createdAt,
    photo,
    videoPoster,
  }
}
