import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, RemoteImage } from '@/components/ui'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'
import { shadow } from '@/theme/surfaces'

import type { LinkCardImageShape, LinkCardMeta } from './link-card'

export interface IndexCardProps {
  host: string
  image?: string
  imageShape?: LinkCardImageShape
  internal?: boolean
  label?: string | null
  meta?: LinkCardMeta[]
  onPress?: () => void
  symbol: string
  title: string
}

export function IndexCard({
  host,
  image,
  imageShape = 'thumb',
  internal,
  label,
  meta = [],
  onPress,
  symbol,
  title,
}: IndexCardProps) {
  const palette = usePalette()
  const serif = useNativeSerifFontStyle()
  const state = meta.find((item) => item.toneDot && item.tone)
  const stateColor = state?.tone ? palette.semantic[state.tone] : undefined

  return (
    <NativePressable
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: palette.surface.paper,
          boxShadow: shadow.paperSmall[palette.theme],
        },
      ]}
      onPress={onPress}
    >
      {image ? (
        <RemoteImage
          contentFit="cover"
          siteReferer={getSiteUrl()}
          style={[styles.media, styles[imageShape], { backgroundColor: palette.neutral[2] }]}
          uri={image}
        />
      ) : (
        <View
          style={[
            styles.media,
            styles.tile,
            {
              backgroundColor: stateColor
                ? `${stateColor}1f`
                : palette.surface.well,
            },
          ]}
        >
          {internal ? (
            <AppText style={[styles.monogram, serif]} variant="body">
              白
            </AppText>
          ) : (
            <SymbolView
              name={symbol as SymbolViewProps['name']}
              size={20}
              tintColor={stateColor ?? palette.neutral[7]}
            />
          )}
        </View>
      )}
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="body">
          {title}
        </AppText>
        <View style={styles.sub}>
          <AppText numberOfLines={1} style={styles.subText} variant="meta">
            {label ?? host}
          </AppText>
          {meta.map((item) => {
            const color = item.tone
              ? palette.semantic[item.tone]
              : palette.neutral[6]
            return (
              <View key={item.text} style={styles.metaItem}>
                {item.symbol ? (
                  <SymbolView
                    name={item.symbol as SymbolViewProps['name']}
                    size={10}
                    tintColor={color}
                  />
                ) : null}
                {item.dot === undefined || item.toneDot ? null : (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: item.dot ?? palette.neutral[5] },
                    ]}
                  />
                )}
                <AppText color={color} style={styles.metaText} variant="meta">
                  {item.text}
                </AppText>
              </View>
            )
          })}
        </View>
      </View>
      <SymbolView
        name={internal ? 'chevron.right' : 'arrow.up.right'}
        size={13}
        tintColor={palette.neutral[5]}
      />
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    height: 64,
    paddingLeft: 10,
    paddingRight: 14,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  media: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderCurve: 'continuous',
  },
  thumb: {},
  square: { borderRadius: 6 },
  avatar: { borderRadius: 22 },
  poster: { width: 38, height: 56, borderRadius: 4 },
  tile: { alignItems: 'center', justifyContent: 'center' },
  monogram: { fontSize: 22, lineHeight: 28 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontWeight: '500', fontSize: 15, lineHeight: 21 },
  sub: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  subText: { flexShrink: 1 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  metaText: { fontVariant: ['tabular-nums'] },
  dot: { width: 6, height: 6, borderRadius: 3 },
})
