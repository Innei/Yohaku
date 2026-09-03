import { StyleSheet, View } from 'react-native'

import { usePalette } from '@/theme/palette'

import { noteDetailCoverHeight } from '../lists/note-cover'

function deskMask(hex: string) {
  const r = Number.parseInt(hex.slice(1, 3), 16)
  const g = Number.parseInt(hex.slice(3, 5), 16)
  const b = Number.parseInt(hex.slice(5, 7), 16)
  const stop = (alpha: number) => `rgba(${r},${g},${b},${alpha})`
  return `linear-gradient(180deg, ${stop(0)} 0%, ${stop(0.08)} 42%, ${stop(0.28)} 62%, ${stop(0.62)} 78%, ${stop(1)} 92%)`
}

export function NoteCoverBleed({ headerHeight }: { headerHeight: number }) {
  const palette = usePalette()
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={[
        styles.bleed,
        {
          height: noteDetailCoverHeight(headerHeight),
          marginTop: -headerHeight,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.mask,
          { experimental_backgroundImage: deskMask(palette.surface.desk) },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  bleed: {
    marginHorizontal: -20,
  },
  mask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})
