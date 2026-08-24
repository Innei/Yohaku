import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable, type NativePressableProps } from '@/components/ui'
import { useLocale } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { usePalette } from '@/theme/palette'

import { ListEntry, ListEntryDot, ListEntryMeta } from '../lists/list-entry'

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
  title,
  onAccessibilityTap,
}: Pick<NativePressableProps, 'onAccessibilityTap'> & {
  accent: string | null
  createdAt: Date
  title: string
}) {
  const locale = useLocale()
  const palette = usePalette()
  return (
    <NativePressable
      accessibilityRole="link"
      onAccessibilityTap={onAccessibilityTap}
    >
      <ListEntry title={title}>
        <ListEntryMeta>
          <AppText variant="meta">
            {formatRelativeTime(createdAt, locale)}
          </AppText>
          {accent ? (
            <>
              <ListEntryDot />
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
        </ListEntryMeta>
      </ListEntry>
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  item: {
    paddingTop: 12,
    paddingBottom: 11,
  },
  accent: {
    flexShrink: 1,
  },
})
