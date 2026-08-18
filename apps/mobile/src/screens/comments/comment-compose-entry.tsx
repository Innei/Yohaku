import { radius, type as typeScale } from '@yohaku/design-system/tokens'
import { StyleSheet, View } from 'react-native'

import { AppText, SinkPressable } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function CommentComposeEntry({
  onPress,
  placeholder,
}: {
  onPress?: () => void
  placeholder: string
}) {
  const palette = usePalette()

  return (
    <SinkPressable
      accessibilityLabel={placeholder}
      accessibilityRole="button"
      onPress={onPress}
    >
      <View
        style={[
          styles.well,
          {
            backgroundColor: palette.surface.well,
            boxShadow: shadow.wellInset[palette.theme],
          },
        ]}
      >
        <AppText
          color={palette.neutral[5]}
          numberOfLines={1}
          style={styles.placeholder}
        >
          {placeholder}
        </AppText>
      </View>
    </SinkPressable>
  )
}

const styles = StyleSheet.create({
  well: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: radius.field,
    borderCurve: 'continuous',
  },
  placeholder: {
    ...fonts.sans,
    fontSize: typeScale.copy15.size,
    lineHeight: typeScale.copy15.lineHeight,
  },
})
