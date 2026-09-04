import { useEffect } from 'react'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'

import { NavigationHeaderTitle } from '../../../modules/yohaku'

export interface InkMark {
  identity: string
  position: number
}

// Wide enough that UIKit never nudges the title right to clear the back
// button — a narrower clearance centers short titles visibly off-axis.
const BACK_BUTTON_CLEARANCE = 160
const ACTION_CLEARANCE = 88
const TITLE_HEIGHT = 40
const TITLE_SIZE = 16
const SUBTITLE_SIZE = 12
const RISE = 6

const INK_WIDTH = 88
const INK_GAP = 4
const INK_HEIGHT = 2
const TICK_HEIGHT = 4
const AnimatedNavigationHeaderTitle = Animated.createAnimatedComponent(
  NavigationHeaderTitle,
)

export function CollapsingHeaderTitle({
  leadingInset = 0,
  marks,
  progress,
  readPercent,
  reserveBackClearance = true,
  rise,
  scrollVelocity,
  subtitle,
  systemAdaptiveTitleColor = false,
  title,
  titleFontSize = TITLE_SIZE,
  titleFontWeight = 'semibold',
  visible,
}: {
  leadingInset?: number
  marks?: InkMark[]
  progress: SharedValue<number>
  readPercent?: SharedValue<number>
  reserveBackClearance?: boolean
  rise?: SharedValue<number>
  scrollVelocity?: SharedValue<number>
  subtitle: string
  systemAdaptiveTitleColor?: boolean
  title: string
  titleFontSize?: number
  titleFontWeight?: 'bold' | 'heavy' | 'medium' | 'semibold'
  visible?: SharedValue<boolean>
}) {
  const { width } = useWindowDimensions()
  const palette = usePalette()
  const ink =
    marks && marks.length > 0 && readPercent ? { marks, readPercent } : null

  const titleAnimatedProps = useAnimatedProps(() => ({
    scrollVelocity: scrollVelocity ? scrollVelocity.value : 0,
    titleVisible: (visible ? visible.value : progress.value > 0.5) ? 1 : 0,
  }))

  return (
    // RNSScreenStackHeaderSubview lays out its child with no intrinsic
    // constraints, so a bare Text collapses to zero size and never appears.
    <View
      style={[
        styles.frame,
        {
          height: ink ? TITLE_HEIGHT + INK_GAP + TICK_HEIGHT : TITLE_HEIGHT,
          paddingLeft: reserveBackClearance ? 0 : leadingInset,
          paddingRight: reserveBackClearance ? 0 : ACTION_CLEARANCE,
          width: reserveBackClearance ? width - BACK_BUTTON_CLEARANCE : width,
        },
      ]}
    >
      <AnimatedNavigationHeaderTitle
        animatedProps={titleAnimatedProps}
        scrollVelocity={0}
        style={styles.nativeTitle}
        subtitle={subtitle}
        subtitleColor={palette.neutral[7]}
        subtitleFontSize={SUBTITLE_SIZE}
        testID="header-title-reveal"
        title={title}
        titleColor={systemAdaptiveTitleColor ? undefined : palette.neutral[10]}
        titleFontSize={titleFontSize}
        titleFontWeight={titleFontWeight}
        titleVisible={0}
      />
      {ink ? (
        <TitleInk
          marks={ink.marks}
          progress={progress}
          readPercent={ink.readPercent}
          rise={rise}
        />
      ) : null}
    </View>
  )
}

function TitleInk({
  marks,
  progress,
  readPercent,
  rise,
}: {
  marks: InkMark[]
  progress: SharedValue<number>
  readPercent: SharedValue<number>
  rise?: SharedValue<number>
}) {
  const palette = usePalette()

  const revealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, progress.value)),
    transform: [{ translateY: (1 - (rise ? rise.value : progress.value)) * RISE }],
  }))
  const fillStyle = useAnimatedStyle(() => ({
    width: (readPercent.value / 100) * INK_WIDTH,
  }))

  return (
    <Animated.View
      entering={FadeIn.duration(timings.emerge.duration)}
      exiting={FadeOut.duration(timings.emerge.duration)}
      style={[styles.ink, revealStyle]}
    >
      <View style={[styles.track, { backgroundColor: palette.neutral[8] }]} />
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: palette.neutral[8] },
          fillStyle,
        ]}
      />
      {marks.map((mark) => (
        <InkTick
          color={palette.neutral[6]}
          key={mark.identity}
          position={mark.position}
        />
      ))}
    </Animated.View>
  )
}

function InkTick({ color, position }: { color: string; position: number }) {
  const left = useSharedValue(position)

  useEffect(() => {
    left.set(withTiming(position, timings.drift))
  }, [left, position])

  const style = useAnimatedStyle(() => ({
    left: (left.value / 100) * INK_WIDTH - 1,
  }))

  return (
    <Animated.View
      entering={FadeIn.duration(timings.emerge.duration)}
      exiting={FadeOut.duration(timings.emerge.duration)}
      style={[styles.tick, { backgroundColor: color }, style]}
    />
  )
}

const styles = StyleSheet.create({
  frame: {
    height: TITLE_HEIGHT,
  },
  nativeTitle: {
    flex: 1,
  },
  ink: {
    bottom: 0,
    height: TICK_HEIGHT,
    left: '50%',
    marginLeft: -INK_WIDTH / 2,
    position: 'absolute',
    width: INK_WIDTH,
  },
  track: {
    borderRadius: 1,
    bottom: 1,
    height: INK_HEIGHT,
    left: 0,
    opacity: 0.12,
    position: 'absolute',
    right: 0,
  },
  fill: {
    borderRadius: 1,
    bottom: 1,
    height: INK_HEIGHT,
    left: 0,
    opacity: 0.7,
    position: 'absolute',
  },
  tick: {
    borderRadius: 1,
    bottom: 0,
    height: TICK_HEIGHT,
    opacity: 0.55,
    position: 'absolute',
    width: 2,
  },
})
