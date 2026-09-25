import { SymbolView, type SymbolViewProps } from 'expo-symbols'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, RemoteImage } from '@/components/ui'
import { getSiteUrl } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import type { LinkCardImageShape, LinkCardMeta } from './link-card'

export interface IndexCardProps {
  description?: string
  host: string
  image?: string
  imageShape?: LinkCardImageShape
  label?: string | null
  meta?: LinkCardMeta[]
  onPress?: () => void
  symbol: string
  title: string
}

export function IndexCard({
  description,
  host,
  image,
  imageShape = 'thumb',
  label,
  meta = [],
  onPress,
  symbol,
  title,
}: IndexCardProps) {
  const palette = usePalette()
  const leading = image && (imageShape === 'poster' || imageShape === 'square')
  const media = image ? (
    <RemoteImage
      contentFit="cover"
      siteReferer={getSiteUrl()}
      style={[styles[imageShape], { backgroundColor: palette.neutral[2] }]}
      uri={image}
    />
  ) : null

  return (
    <NativePressable
      disabled={!onPress}
      style={[
        styles.card,
        {
          alignItems: leading ? 'stretch' : 'flex-start',
          backgroundColor: palette.surface.paper,
          borderColor: palette.neutral[3],
        },
      ]}
      onPress={onPress}
    >
      {leading ? media : null}
      <View style={styles.copy}>
        <View style={styles.source}>
          <SymbolView
            name={symbol as SymbolViewProps['name']}
            size={12}
            tintColor={palette.neutral[6]}
          />
          <AppText numberOfLines={1} style={styles.sourceText} variant="meta">
            {label ? `${host} · ${label}` : host}
          </AppText>
        </View>
        <AppText numberOfLines={2} style={styles.title} variant="body">
          {title}
        </AppText>
        {description ? (
          <AppText numberOfLines={2} variant="secondary">
            {description}
          </AppText>
        ) : null}
        {meta.length ? (
          <View style={styles.meta}>
            {meta.map((item) => {
              const color = item.tone
                ? palette.semantic[item.tone]
                : palette.neutral[6]
              return (
                <View key={item.text} style={styles.metaItem}>
                  {item.symbol ? (
                    <SymbolView
                      name={item.symbol as SymbolViewProps['name']}
                      size={11}
                      tintColor={color}
                    />
                  ) : null}
                  {item.dot === undefined ? null : (
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
        ) : null}
      </View>
      {leading ? null : media}
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 14,
    gap: 12,
    flexDirection: 'row',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  source: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { flexShrink: 1 },
  title: { fontWeight: '600', fontSize: 16, lineHeight: 22 },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    rowGap: 4,
    marginTop: 3,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontVariant: ['tabular-nums'] },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderCurve: 'continuous',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  poster: {
    width: 56,
    height: 84,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  square: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
})
