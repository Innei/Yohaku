import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper, RemoteImage } from '@/components/ui'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { UnsupportedBlock } from './card-blocks'
import {
  formatTweetDate,
  type ParsedTweet,
  parseTweet,
  type TweetEntityRange,
  tweetIdFromUrl,
  tweetToken,
} from './tweet'
import { type BlockProps, str } from './types'

const MEDIA_RADIUS = 12

async function fetchTweet(id: string): Promise<ParsedTweet | null> {
  const res = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=zh&token=${tweetToken(id)}`,
  )
  if (!res.ok) return null
  const json = await res.json()
  return parseTweet(json)
}

function TweetText({
  entities,
  text,
}: {
  entities: TweetEntityRange[]
  text: string
}) {
  const doc = useRichDocument()
  const palette = usePalette()
  const codePoints = Array.from(text)
  const nodes: ReactNode[] = []
  let cursor = 0
  entities.forEach((entity) => {
    if (entity.start > cursor) {
      nodes.push(codePoints.slice(cursor, entity.start).join(''))
    }
    nodes.push(
      <AppText
        color={palette.accent}
        key={`${entity.type}-${entity.start}`}
        onPress={() => doc.onLinkPress?.(entity.href)}
      >
        {codePoints.slice(entity.start, entity.end).join('')}
      </AppText>,
    )
    cursor = entity.end
  })
  if (cursor < codePoints.length) {
    nodes.push(codePoints.slice(cursor).join(''))
  }
  return (
    <AppText style={styles.text} variant="body">
      {nodes}
    </AppText>
  )
}

function TweetSkeleton() {
  const palette = usePalette()
  const bone = { backgroundColor: palette.neutral[2] }
  return (
    <Paper style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, bone]} />
        <View style={styles.headerText}>
          <View style={[styles.skeletonLine, { width: '40%' }, bone]} />
          <View style={[styles.skeletonLine, { width: '26%' }, bone]} />
        </View>
      </View>
      <View style={[styles.skeletonLine, { width: '100%' }, bone]} />
      <View style={[styles.skeletonLine, { width: '84%' }, bone]} />
      <View style={[styles.media, bone]} />
    </Paper>
  )
}

export function TweetBlock({ blockId, node }: BlockProps) {
  const doc = useRichDocument()
  const palette = usePalette()
  const url = str(node.url)
  const id = tweetIdFromUrl(url)

  const query = useQuery({
    enabled: id !== null,
    queryFn: () => fetchTweet(id!),
    queryKey: ['tweet', id],
    staleTime: Infinity,
  })

  if (query.isPending && id !== null) return <TweetSkeleton />
  if (id === null || query.isError || !query.data) {
    return <UnsupportedBlock blockId={blockId} node={node} />
  }

  const tweet = query.data
  const media = tweet.photo ?? tweet.videoPoster
  const mediaRatio = media ? media.width / media.height : undefined

  return (
    <Paper style={styles.card}>
      <View style={styles.header}>
        <RemoteImage
          contentFit="cover"
          style={styles.avatar}
          uri={tweet.user.avatar}
        />
        <View style={styles.headerText}>
          <AppText numberOfLines={1} variant="secondary">
            {tweet.user.name}
          </AppText>
          <AppText color={palette.neutral[6]} numberOfLines={1} variant="meta">
            @{tweet.user.screenName}
          </AppText>
        </View>
        <AppText color={palette.neutral[5]} variant="meta">
          X
        </AppText>
      </View>
      <TweetText entities={tweet.entities} text={tweet.text} />
      {media ? (
        tweet.photo ? (
          <RemoteImage
            contentFit="cover"
            images={[tweet.photo.url]}
            index={0}
            uri={tweet.photo.url}
            style={[
              styles.media,
              { aspectRatio: mediaRatio, backgroundColor: palette.neutral[2] },
            ]}
          />
        ) : (
          <RemoteImage
            contentFit="cover"
            uri={media.url}
            style={[
              styles.media,
              { aspectRatio: mediaRatio, backgroundColor: palette.neutral[2] },
            ]}
          />
        )
      ) : null}
      <View style={styles.footer}>
        <AppText color={palette.neutral[6]} variant="meta">
          {formatTweetDate(tweet.createdAt)}
        </AppText>
        <NativePressable onPress={() => doc.onLinkPress?.(url)}>
          <AppText color={palette.accent} variant="meta">
            在 X 上查看
          </AppText>
        </NativePressable>
      </View>
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 12, padding: 16, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1, gap: 1, minWidth: 0 },
  text: { lineHeight: 24 },
  media: { width: '100%', borderRadius: MEDIA_RADIUS, overflow: 'hidden' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  skeletonLine: { height: 12, borderRadius: 6 },
})
