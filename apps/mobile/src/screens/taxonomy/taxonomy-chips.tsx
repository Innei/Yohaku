import { StyleSheet, View } from 'react-native'

import { AppText, NativePressable } from '@/components/ui'
import { usePalette } from '@/theme/palette'

export function TaxonomyChips({
  label,
  items,
  onPress,
}: {
  items: { count: number; label: string; key: string }[]
  label: string
  onPress: (key: string) => void
}) {
  const palette = usePalette()
  if (items.length === 0) return null
  return (
    <View
      style={[styles.section, { borderTopColor: `${palette.neutral[10]}0f` }]}
    >
      <AppText color={palette.neutral[6]} style={styles.label} variant="eyebrow">
        {label}
      </AppText>
      <View style={styles.row}>
        {items.map((item) => (
          <NativePressable
            key={item.key}
            accessibilityRole="link"
            style={[
              styles.chip,
              {
                backgroundColor: palette.surface.paper,
                borderColor: `${palette.neutral[10]}0f`,
              },
            ]}
            onPress={() => onPress(item.key)}
          >
            <AppText variant="meta">{item.label}</AppText>
            <AppText color={palette.neutral[6]} variant="meta">
              {item.count}
            </AppText>
          </NativePressable>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: {
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
  },
})
