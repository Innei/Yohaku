import { useQuery } from '@tanstack/react-query'
import { SymbolView } from 'expo-symbols'
import { Image, StyleSheet, View } from 'react-native'

import { AppText, NativePressable, Paper, RemoteImage } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import { UnsupportedBlock } from './card-blocks'
import { useBoneColor } from './skeleton'
import {
  type ParsedTweet,
  parseTweet,
  tweetIdFromUrl,
  tweetToken,
} from './tweet'
import { TweetMediaView } from './tweet-media'
import {
  QuotedTweet,
  statusUrl,
  TweetFooter,
  TweetText,
  VerifiedSeal,
} from './tweet-parts'
import { type BlockProps, str } from './types'

const CARD_PADDING = 16
const X_LOGO = require('../../../assets/social/x.png')

async function fetchTweet(id: string): Promise<ParsedTweet | null> {
  const res = await fetch(
    `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=zh&token=${tweetToken(id)}`,
  )
  if (!res.ok) throw new Error(`${res.status}`)
  const json = await res.json()
  return parseTweet(json)
}

function TweetSkeleton() {
  const bone = { backgroundColor: useBoneColor() }
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
      <View style={[styles.skeletonMedia, bone]} />
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
  const { replyTo } = tweet

  return (
    <Paper style={styles.card}>
      <View style={styles.header}>
        <RemoteImage
          contentFit="cover"
          style={styles.avatar}
          uri={tweet.user.avatar}
        />
        <View style={styles.headerText}>
          <View style={styles.nameRow}>
            <AppText
              color={palette.neutral[9]}
              numberOfLines={1}
              style={styles.name}
              variant="secondary"
            >
              {tweet.user.name}
            </AppText>
            {tweet.user.verified ? <VerifiedSeal size={15} /> : null}
          </View>
          <AppText color={palette.neutral[7]} numberOfLines={1} variant="meta">
            @{tweet.user.screenName}
          </AppText>
        </View>
        <Image
          accessibilityLabel="X"
          source={X_LOGO}
          style={[styles.xLogo, { tintColor: palette.neutral[9] }]}
        />
      </View>
      {replyTo ? (
        <NativePressable
          haptic={false}
          style={styles.replyLine}
          onPress={() =>
            doc.onLinkPress?.(statusUrl(replyTo.screenName, replyTo.statusId))
          }
        >
          <SymbolView
            name="arrow.turn.down.right"
            size={12}
            tintColor={palette.neutral[5]}
          />
          <AppText color={palette.neutral[6]} variant="meta">
            回复{' '}
            <AppText color={palette.accent} variant="meta">
              @{replyTo.screenName}
            </AppText>
          </AppText>
        </NativePressable>
      ) : null}
      {tweet.text ? (
        <TweetText entities={tweet.entities} text={tweet.text} />
      ) : null}
      <TweetMediaView bleed={CARD_PADDING} media={tweet.media} />
      {tweet.quoted ? <QuotedTweet tweet={tweet.quoted} /> : null}
      <TweetFooter tweet={tweet} url={url} />
    </Paper>
  )
}

const styles = StyleSheet.create({
  card: { marginVertical: 12, padding: CARD_PADDING, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  headerText: { flex: 1, gap: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...fonts.sansSemiBold, flexShrink: 1 },
  xLogo: { width: 16, height: 16 },
  replyLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginVertical: -12,
    minHeight: 44,
  },
  skeletonLine: { height: 12, borderRadius: 6 },
  skeletonMedia: { height: 150, borderRadius: 12 },
})
