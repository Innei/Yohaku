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
  return (
    <Image
      resizeMode="repeat"
      source={grainSource[palette.theme]}
      style={[styles.grain, { width, height }, grainBlend[palette.theme]]}
    />
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
  grain: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
    pointerEvents: 'none',
  },
})
