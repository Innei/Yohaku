import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'

import { usePalette } from '@/theme/palette'

const grainSource = {
  light: require('../../../assets/images/paper-grain-light.png'),
  dark: require('../../../assets/images/paper-grain-dark.png'),
}

const wash = {
  light:
    'linear-gradient(180deg, rgba(197,100,115,0.10) 0%, rgba(197,100,115,0.04) 55%, rgba(197,100,115,0) 100%)',
  dark: 'linear-gradient(180deg, rgba(224,149,164,0.09) 0%, rgba(224,149,164,0.035) 55%, rgba(224,149,164,0) 100%)',
}

const grainBlend = {
  light: { mixBlendMode: 'multiply', opacity: 0.35 },
  dark: { mixBlendMode: 'screen', opacity: 0.25 },
} as const

export function MeAmbienceWash() {
  const palette = usePalette()
  return (
    <View
      pointerEvents="none"
      style={[
        styles.wash,
        { experimental_backgroundImage: wash[palette.theme] },
      ]}
    />
  )
}

export function MeAmbienceGrain() {
  const palette = usePalette()
  const { width, height } = useWindowDimensions()
  // The grain is a full-screen decoration: it must live inside a plain
  // `pointerEvents="none"` host, because RN's Image does not reliably forward
  // the prop on Android and the sheet would swallow every tap on the page.
  return (
    <View pointerEvents="none" style={styles.grainLayer}>
      <Image
        pointerEvents="none"
        resizeMode="repeat"
        source={grainSource[palette.theme]}
        style={[styles.grain, { width, height }, grainBlend[palette.theme]]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  grainLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
})
