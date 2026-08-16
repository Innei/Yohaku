import { accent } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { useEffect } from 'react'
import {
  Image,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native'
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { useOwner } from '@/owner/store'
import { splashEasing } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { splashTiming } from '@/theme/splash-timing'

import { SplashColophon } from './splash-colophon'
import { useSplashSequence } from './use-splash-sequence'

const glyphSource = {
  light: require('../../../assets/images/splash-icon.png'),
  dark: require('../../../assets/images/splash-icon-dark.png'),
}

const grainSource = {
  light: require('../../../assets/images/paper-grain-light.png'),
  dark: require('../../../assets/images/paper-grain-dark.png'),
}

/*
 * These MUST equal the mean colour of the matching grain tile and the
 * `expo-splash-screen` backgroundColor in app.config.ts. The native splash paints a
 * flat colour; this overlay paints the textured tile over it. Any mismatch
 * shows as a tone pop the moment JS takes over. Regenerating a tile means
 * re-measuring its mean and updating both places.
 */
const sheetColor = {
  light: '#faf9f6',
  dark: '#282828',
}

const sealColor = {
  light: accent.light,
  dark: accent.dark,
}

const edgeAlpha = {
  light: [0.028, 0.055, 0.1],
  dark: [0.05, 0.1, 0.18],
}

function tapSeal() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
}

export interface SplashOverlayProps {
  appPainted: boolean
  failed: boolean
  onFinished: () => void
  ready: boolean
  revealed: boolean
}

export function SplashOverlay({
  ready,
  failed,
  appPainted,
  revealed,
  onFinished,
}: SplashOverlayProps) {
  const theme = useColorScheme() === 'dark' ? 'dark' : 'light'
  const palette = usePalette()
  const owner = useOwner()
  const { width, height } = useWindowDimensions()
  const { phase, reduceMotion, begun, finish } = useSplashSequence({
    ready,
    failed,
    appPainted,
    revealed,
  })

  const tearY = Math.round(height / 2 + splashTiming.tearOffset)
  const topTravel = tearY
  const bottomTravel = height - tearY
  const bottomDuration = Math.round(
    splashTiming.tear.duration * (bottomTravel / topTravel),
  )

  const bleedOpacity = useSharedValue<number>(splashTiming.bleed.fromOpacity)
  const bleedScale = useSharedValue<number>(splashTiming.bleed.fromScale)
  const glyphScale = useSharedValue<number>(splashTiming.glyph.fromScale)
  const sealOpacity = useSharedValue<number>(0)
  const sealScale = useSharedValue<number>(splashTiming.seal.fromScale)
  const colophonOpacity = useSharedValue<number>(0)
  const markOpacity = useSharedValue<number>(1)
  const topY = useSharedValue<number>(0)
  const bottomY = useSharedValue<number>(0)
  const edgeOpacity = useSharedValue<number>(0)
  const overlayOpacity = useSharedValue<number>(1)

  useEffect(() => {
    if (!begun) return
    if (reduceMotion) {
      bleedOpacity.value = 0
      bleedScale.value = 1
      glyphScale.value = 1
      sealOpacity.value = 1
      sealScale.value = 1
      colophonOpacity.value = 1
      return
    }
    const bleed = {
      duration: splashTiming.bleed.duration,
      easing: splashEasing.bleed,
    }
    const seal = {
      duration: splashTiming.seal.duration,
      easing: splashEasing.seal,
    }
    bleedOpacity.value = withDelay(
      splashTiming.bleed.delay,
      withTiming(0, bleed),
    )
    bleedScale.value = withDelay(splashTiming.bleed.delay, withTiming(1, bleed))
    glyphScale.value = withDelay(splashTiming.bleed.delay, withTiming(1, bleed))
    sealOpacity.value = withDelay(splashTiming.seal.delay, withTiming(1, seal))
    sealScale.value = withDelay(
      splashTiming.seal.delay,
      withTiming(1, seal, (completed) => {
        if (completed) runOnJS(tapSeal)()
      }),
    )
    colophonOpacity.value = withDelay(
      splashTiming.colophon.delay,
      withTiming(1, {
        duration: splashTiming.colophon.duration,
        easing: splashEasing.seal,
      }),
    )
  }, [
    begun,
    reduceMotion,
    bleedOpacity,
    bleedScale,
    glyphScale,
    sealOpacity,
    sealScale,
    colophonOpacity,
  ])

  useEffect(() => {
    if (phase === 'breathing') {
      const config = {
        duration: splashTiming.breath.halfCycle,
        easing: splashEasing.breath,
      }
      topY.value = withRepeat(
        withTiming(-splashTiming.breath.gap / 2, config),
        -1,
        true,
      )
      bottomY.value = withRepeat(
        withTiming(splashTiming.breath.gap / 2, config),
        -1,
        true,
      )
      edgeOpacity.value = withTiming(1, {
        duration: splashTiming.breath.halfCycle,
      })
      return
    }
    if (phase === 'tearing') {
      cancelAnimation(topY)
      cancelAnimation(bottomY)
      edgeOpacity.value = withTiming(1, { duration: splashTiming.edgeFade })
      markOpacity.value = withDelay(
        splashTiming.markExit.lag,
        withTiming(0, { duration: splashTiming.markExit.duration }),
      )
      bottomY.value = withDelay(
        splashTiming.tear.bottomLag,
        withTiming(bottomTravel, {
          duration: bottomDuration,
          easing: splashEasing.tear,
        }),
      )
      topY.value = withTiming(
        -topTravel,
        { duration: splashTiming.tear.duration, easing: splashEasing.tear },
        (completed) => {
          if (completed) runOnJS(finish)()
        },
      )
      return
    }
    if (phase === 'fading') {
      overlayOpacity.value = withTiming(
        0,
        { duration: splashTiming.reducedFade },
        (completed) => {
          if (completed) runOnJS(finish)()
        },
      )
    }
  }, [
    phase,
    topTravel,
    bottomTravel,
    bottomDuration,
    finish,
    topY,
    bottomY,
    edgeOpacity,
    markOpacity,
    overlayOpacity,
  ])

  useEffect(() => {
    if (phase === 'done') onFinished()
  }, [phase, onFinished])

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }))
  const topStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: topY.value }],
  }))
  const bottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomY.value }],
  }))
  const edgeStyle = useAnimatedStyle(() => ({ opacity: edgeOpacity.value }))
  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value }))
  const bleedStyle = useAnimatedStyle(() => ({
    opacity: bleedOpacity.value,
    transform: [{ scale: bleedScale.value }],
  }))
  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glyphScale.value }],
  }))
  const sealStyle = useAnimatedStyle(() => ({
    opacity: sealOpacity.value,
    transform: [{ scale: sealScale.value }],
  }))
  const colophonStyle = useAnimatedStyle(() => ({
    opacity: colophonOpacity.value,
  }))

  if (phase === 'done') return null

  const sheet = { backgroundColor: sheetColor[theme] }
  const markBox = {
    width: splashTiming.markSize,
    height: splashTiming.markSize,
    left: (width - splashTiming.markSize) / 2,
    top: height / 2 - splashTiming.markSize / 2,
  }

  const edgeLines = (reversed: boolean) => {
    const alphas = reversed ? [...edgeAlpha[theme]].reverse() : edgeAlpha[theme]
    return alphas.map((alpha) => (
      <View
        key={alpha}
        style={{ height: 1, backgroundColor: `rgba(0,0,0,${alpha})` }}
      />
    ))
  }

  return (
    <Animated.View style={[styles.root, overlayStyle]}>
      <Animated.View
        style={[styles.half, sheet, { top: 0, height: tearY }, topStyle]}
      >
        <Image
          resizeMode="repeat"
          source={grainSource[theme]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.mark, markBox, markStyle]}>
          <Animated.Image
            source={glyphSource[theme]}
            style={[styles.glyph, bleedStyle]}
          />
          <Animated.Image
            source={glyphSource[theme]}
            style={[styles.glyph, glyphStyle]}
          />
          <Animated.View
            style={[
              styles.seal,
              { backgroundColor: sealColor[theme] },
              sealStyle,
            ]}
          />
        </Animated.View>
        <Animated.View style={[styles.edge, { bottom: 0 }, edgeStyle]}>
          {edgeLines(false)}
        </Animated.View>
      </Animated.View>

      <Animated.View
        style={[
          styles.half,
          sheet,
          { top: tearY, height: height - tearY },
          bottomStyle,
        ]}
      >
        <Image
          resizeMode="repeat"
          source={grainSource[theme]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.edge, { top: 0 }, edgeStyle]}>
          {edgeLines(true)}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.colophon,
            {
              right: splashTiming.colophon.inset,
              bottom: splashTiming.colophon.bottom,
            },
            colophonStyle,
          ]}
        >
          <SplashColophon
            nameColor={palette.neutral[9]}
            owner={owner}
            siteColor={palette.neutral[6]}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  half: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  mark: {
    position: 'absolute',
  },
  glyph: {
    position: 'absolute',
    width: splashTiming.markSize,
    height: splashTiming.markSize,
  },
  seal: {
    position: 'absolute',
    left: splashTiming.seal.left,
    top: splashTiming.seal.top,
    width: splashTiming.seal.diameter,
    height: splashTiming.seal.diameter,
    borderRadius: splashTiming.seal.diameter / 2,
  },
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  colophon: {
    position: 'absolute',
  },
})
