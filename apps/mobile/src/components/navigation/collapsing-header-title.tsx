import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import Animated, {
  FadeIn,
  FadeOut,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { SlotText } from '@/components/ui'
import { fonts } from '@/theme/fonts'
import { springs, timings } from '@/theme/motion'
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
const TICK_DROP = 3
const TICK_LEAVE_MS = 400
const TICK_SETTLE_MS = 1200
const AnimatedNavigationHeaderTitle = Animated.createAnimatedComponent(
  NavigationHeaderTitle,
)

export function CollapsingHeaderTitle({
  leadingInset = 0,
  marks,
  onPress,
  progress,
  readerCount = 0,
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
  onPress?: () => void
  progress: SharedValue<number>
  readerCount?: number
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
  const hasMarks = Boolean(marks && marks.length > 0)
  const [known] = useState(
    () => new Set((marks ?? []).map((mark) => mark.identity)),
  )
  const [hadMarks, setHadMarks] = useState(hasMarks)
  const [lingering, setLingering] = useState(false)
  if (hadMarks !== hasMarks) {
    setHadMarks(hasMarks)
    setLingering(!hasMarks)
  }
  useEffect(() => {
    if (!lingering) return
    const timer = setTimeout(() => setLingering(false), TICK_LEAVE_MS)
    return () => clearTimeout(timer)
  }, [lingering])
  const ink =
    readPercent && (hasMarks || lingering)
      ? { marks: marks ?? [], readPercent }
      : null

  const titleAnimatedProps = useAnimatedProps(() => ({
    scrollVelocity: scrollVelocity ? scrollVelocity.value : 0,
    titleVisible: (visible ? visible.value : progress.value > 0.5) ? 1 : 0,
  }))

  const Frame = onPress ? Pressable : View
  return (
    // RNSScreenStackHeaderSubview lays out its child with no intrinsic
    // constraints, so a bare Text collapses to zero size and never appears.
    <Frame
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.frame,
        {
          height: ink ? TITLE_HEIGHT + INK_GAP + TICK_HEIGHT : TITLE_HEIGHT,
          paddingLeft: reserveBackClearance ? 0 : leadingInset,
          paddingRight: reserveBackClearance ? 0 : ACTION_CLEARANCE,
          width: reserveBackClearance ? width - BACK_BUTTON_CLEARANCE : width,
        },
      ]}
      onPress={onPress}
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
          count={readerCount > 0 ? readerCount + 1 : null}
          known={known}
          marks={ink.marks}
          progress={progress}
          readPercent={ink.readPercent}
          rise={rise}
        />
      ) : null}
    </Frame>
  )
}

function TitleInk({
  count,
  known,
  marks,
  progress,
  readPercent,
  rise,
}: {
  count: number | null
  known: Set<string>
  marks: InkMark[]
  progress: SharedValue<number>
  readPercent: SharedValue<number>
  rise?: SharedValue<number>
}) {
  const palette = usePalette()
  const [shownCount, setShownCount] = useState(count)
  const [flash, setFlash] = useState(false)
  if (shownCount !== count) {
    setShownCount(count)
    if (count !== null && shownCount !== null && count > shownCount) {
      setFlash(true)
    }
  }
  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(false), TICK_SETTLE_MS)
    return () => clearTimeout(timer)
  }, [flash])

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
          accent={`${palette.accent}99`}
          color={palette.neutral[6]}
          fresh={!known.has(mark.identity)}
          key={mark.identity}
          position={mark.position}
        />
      ))}
      {count === null ? null : (
        <View style={styles.count}>
          <SlotText
            value={count}
            textStyle={{
              ...styles.countText,
              color: flash ? palette.accent : palette.neutral[5],
            }}
          />
        </View>
      )}
    </Animated.View>
  )
}

function InkTick({
  accent,
  color,
  fresh,
  position,
}: {
  accent: string
  color: string
  fresh: boolean
  position: number
}) {
  const left = useSharedValue(position)
  const tint = useSharedValue(fresh ? 1 : 0)
  const drop = useSharedValue(fresh ? -TICK_DROP : 0)

  useEffect(() => {
    tint.set(withTiming(0, { duration: TICK_SETTLE_MS }))
    drop.set(withSpring(0, springs.settle))
  }, [drop, tint])

  useEffect(() => {
    left.set(withTiming(position, timings.drift))
  }, [left, position])

  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(tint.value, [0, 1], [color, accent]),
    left: (left.value / 100) * INK_WIDTH - 1,
    transform: [{ translateY: drop.value }],
  }))

  return (
    <Animated.View
      entering={FadeIn.duration(timings.emerge.duration)}
      exiting={FadeOut.duration(TICK_LEAVE_MS)}
      style={[styles.tick, style]}
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
  count: {
    left: INK_WIDTH + 6,
    position: 'absolute',
    top: -4,
  },
  countText: {
    ...fonts.mono,
    fontSize: 10,
    lineHeight: 12,
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
