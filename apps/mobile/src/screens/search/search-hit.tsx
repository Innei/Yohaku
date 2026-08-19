import { type as typeScale } from '@yohaku/design-system/tokens'
import { memo } from 'react'
import { StyleSheet, Text } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { highlightSegments, type SearchHit, type SearchScope } from './local-search'

export const SearchHitRow = memo(function SearchHitRow({
  hit,
  scope,
  onPress,
}: {
  hit: SearchHit
  onPress: () => void
  scope: SearchScope
}) {
  const locale = useLocale()
  const t = useTranslations('search')
  const palette = usePalette()
  const snippetLines = scope === 'thinking' ? 3 : 2
  const mood = [hit.weather, hit.mood].filter(Boolean).join(' · ')
  const meta =
    scope === 'posts'
      ? hit.categoryName
      : [formatRelativeTime(hit.createdAt, locale), mood || null]
          .filter(Boolean)
          .join(' · ')

  return (
    <NativePressable
      accessibilityRole="button"
      style={[styles.row, { borderBottomColor: `${palette.neutral[10]}14` }]}
      onPress={onPress}
    >
      {hit.title ? (
        <HighlightedText
          color={palette.neutral[9]}
          keywords={hit.keywords}
          numberOfLines={1}
          size="title"
          text={hit.title}
        />
      ) : null}
      {hit.snippet ? (
        <HighlightedText
          color={palette.neutral[6]}
          keywords={hit.keywords}
          numberOfLines={snippetLines}
          size="snippet"
          text={hit.snippet}
        />
      ) : null}
      {meta ? (
        <AppText style={hit.snippet || hit.title ? styles.meta : undefined} variant="meta">
          {meta}
        </AppText>
      ) : null}
      {hit.isFallback ? (
        <AppText variant="meta">{t('fallbackToSource')}</AppText>
      ) : null}
    </NativePressable>
  )
})

function HighlightedText({
  color,
  keywords,
  numberOfLines,
  size,
  text,
}: {
  color: string
  keywords: string[]
  numberOfLines: number
  size: 'title' | 'snippet'
  text: string
}) {
  const palette = usePalette()
  const scale = size === 'title' ? typeScale.copy15 : typeScale.copy13
  const segments = highlightSegments(text, keywords)

  return (
    <Text
      numberOfLines={numberOfLines}
      style={{
        ...fonts.sans,
        color,
        fontSize: scale.size,
        lineHeight: scale.lineHeight,
      }}
    >
      {segments.map((segment) => (
        <Text
          key={segment.key}
          style={
            segment.highlighted
              ? {
                  backgroundColor: palette.accent,
                  borderRadius: 3,
                  color: palette.surface.desk,
                }
              : undefined
          }
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  )
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
    minHeight: 44,
  },
  meta: {
    marginTop: 2,
  },
})
