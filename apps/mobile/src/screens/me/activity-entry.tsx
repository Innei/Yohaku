import { type as typeScale } from '@yohaku/design-system/tokens'
import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, type NativePressableProps } from '@/components/ui'
import { useLocale } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function ActivityUnavailable({ label }: { label: string }) {
  const palette = usePalette()
  return (
    <View style={styles.item}>
      <AppText color={palette.neutral[6]} variant="body">
        {label}
      </AppText>
    </View>
  )
}

export function ActivityEntry({
  accent,
  createdAt,
  excerpt,
  title,
  onAccessibilityTap,
}: Pick<NativePressableProps, 'onAccessibilityTap'> & {
  accent: string | null
  createdAt: Date
  excerpt: string
  title: string
}) {
  const locale = useLocale()
  const palette = usePalette()
  return (
    <NativePressable
      accessibilityRole="link"
      style={styles.item}
      onAccessibilityTap={onAccessibilityTap}
    >
      <AppText numberOfLines={2} style={styles.title} variant="entryTitleSans">
        {title}
      </AppText>
      {excerpt ? (
        <AppText
          color={palette.neutral[6]}
          numberOfLines={1}
          style={styles.excerpt}
          variant="secondary"
        >
          {excerpt}
        </AppText>
      ) : null}
      <View style={styles.metaRow}>
        <AppText variant="meta">{formatRelativeTime(createdAt, locale)}</AppText>
        {accent ? (
          <>
            <AppText color={palette.neutral[4]} variant="meta">
              ·
            </AppText>
            <AppText
              color={palette.accent}
              numberOfLines={1}
              style={styles.accent}
              variant="meta"
            >
              {accent}
            </AppText>
          </>
        ) : null}
      </View>
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingTop: 12,
    paddingBottom: 11,
  },
  title: {
    ...fonts.sansMedium,
    fontSize: typeScale.copy16.size,
    lineHeight: typeScale.copy16.lineHeight,
  },
  excerpt: {
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
    marginTop: 10,
  },
  accent: {
    flexShrink: 1,
  },
})
