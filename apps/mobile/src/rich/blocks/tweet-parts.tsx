import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, RemoteImage } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { useRichDocument } from '../lexical/context'
import {
  formatTweetCount,
  formatTweetDate,
  type ParsedTweet,
  type TweetEntityRange,
} from './tweet'

export const statusUrl = (screenName: string, id: string) =>
  `https://x.com/${screenName}/status/${id}`

export function TweetText({
  entities,
  numberOfLines,
  text,
}: {
  entities: TweetEntityRange[]
  numberOfLines?: number
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
    <AppText numberOfLines={numberOfLines} style={styles.text} variant="body">
      {nodes}
    </AppText>
  )
}

export function VerifiedSeal({ size }: { size: number }) {
  const palette = usePalette()
  return (
    <SymbolView
      name="checkmark.seal.fill"
      size={size}
      tintColor={palette.neutral[7]}
    />
  )
}

export function QuotedTweet({ tweet }: { tweet: ParsedTweet }) {
  const doc = useRichDocument()
  const palette = usePalette()
  const thumb = tweet.media[0]
  return (
    <NativePressable
      accessibilityLabel="查看被引用的推文"
      haptic={false}
      style={[styles.quoted, { backgroundColor: palette.neutral[1] }]}
      onPress={() =>
        doc.onLinkPress?.(statusUrl(tweet.user.screenName, tweet.id))
      }
    >
      <View style={styles.quotedHeader}>
        <RemoteImage
          contentFit="cover"
          style={styles.quotedAvatar}
          uri={tweet.user.avatar}
        />
        <AppText
          color={palette.neutral[9]}
          numberOfLines={1}
          style={styles.name}
          variant="meta"
        >
          {tweet.user.name}
        </AppText>
        {tweet.user.verified ? <VerifiedSeal size={12} /> : null}
        <AppText
          color={palette.neutral[7]}
          numberOfLines={1}
          style={styles.shrink}
          variant="meta"
        >
          @{tweet.user.screenName}
        </AppText>
      </View>
      <View style={styles.quotedBody}>
        <View style={styles.headerText}>
          <TweetText
            entities={tweet.entities}
            numberOfLines={3}
            text={tweet.text}
          />
        </View>
        {thumb ? (
          <RemoteImage
            contentFit="cover"
            style={styles.quotedThumb}
            uri={thumb.url}
          />
        ) : null}
      </View>
    </NativePressable>
  )
}

export function TweetFooter({
  tweet,
  url,
}: {
  tweet: ParsedTweet
  url: string
}) {
  const doc = useRichDocument()
  const palette = usePalette()
  const stat = (symbol: 'bubble.left' | 'heart', count?: number) =>
    count === undefined ? null : (
      <View style={styles.stat}>
        <SymbolView name={symbol} size={13} tintColor={palette.neutral[6]} />
        <AppText color={palette.neutral[6]} style={styles.nums} variant="meta">
          {formatTweetCount(count)}
        </AppText>
      </View>
    )
  return (
    <View style={styles.footer}>
      <View style={styles.stats}>
        <AppText color={palette.neutral[6]} style={styles.nums} variant="meta">
          {formatTweetDate(tweet.createdAt)}
        </AppText>
        {stat('heart', tweet.likes)}
        {stat('bubble.left', tweet.replies)}
      </View>
      <NativePressable
        haptic={false}
        style={styles.viewOnX}
        onPress={() => doc.onLinkPress?.(url)}
      >
        <AppText color={palette.accent} variant="meta">
          在 X 上查看
        </AppText>
      </NativePressable>
    </View>
  )
}

const styles = StyleSheet.create({
  text: { lineHeight: 24 },
  shrink: { flexShrink: 1 },
  name: { ...fonts.sansSemiBold, flexShrink: 1 },
  headerText: { flex: 1, gap: 1, minWidth: 0 },
  quoted: { borderRadius: 12, gap: 6, padding: 12 },
  quotedHeader: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  quotedAvatar: { width: 20, height: 20, borderRadius: 10 },
  quotedBody: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  quotedThumb: { width: 56, height: 56, borderRadius: 8 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginVertical: -8,
  },
  stats: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  stat: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  nums: { fontVariant: ['tabular-nums'] },
  viewOnX: { minHeight: 44, justifyContent: 'center' },
})
