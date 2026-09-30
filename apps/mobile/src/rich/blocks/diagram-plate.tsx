import { radius } from '@yohaku/design-system/tokens'
import { SymbolView } from 'expo-symbols'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function DiagramPlate({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  const palette = usePalette()
  return (
    <View
      style={[
        styles.plate,
        { backgroundColor: palette.neutral[1], borderColor: palette.neutral[3] },
      ]}
    >
      {children}
      <View pointerEvents="none" style={styles.zoom}>
        <SymbolView
          name="arrow.up.left.and.arrow.down.right"
          size={13}
          tintColor={palette.neutral[6]}
        />
      </View>
      <AppText
        color={palette.neutral[5]}
        pointerEvents="none"
        style={[styles.label, fonts.mono]}
      >
        {label}
      </AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  plate: {
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: 1,
    marginVertical: 12,
    overflow: 'hidden',
    paddingBottom: 22,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  zoom: { position: 'absolute', right: 12, top: 12 },
  label: {
    bottom: 7,
    fontSize: 10,
    lineHeight: 14,
    position: 'absolute',
    right: 14,
  },
})
