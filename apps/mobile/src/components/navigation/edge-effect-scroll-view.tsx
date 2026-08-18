import { LegacyScrollEdgeMask } from '@modules/yohaku'
import type { Ref } from 'react'
import { useCallback, useRef } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
} from 'react-native'
import { Platform, StyleSheet } from 'react-native'
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { ScrollViewMarker } from 'react-native-screens/experimental'

import {
  PAPER_TAB_BAR_SCROLL_EDGE_BLEED,
  usePaperTabBarInset,
} from './paper-tab-bar-inset'

type ReanimatedScrollHandler = ReturnType<typeof useAnimatedScrollHandler>
type EdgeEffectScrollViewProps = ScrollViewProps & {
  headerTitleProgress?: SharedValue<number>
  ref?: Ref<ScrollView>
}

const SCROLL_EDGE_TRANSITION_DISTANCE = 32
const LEGACY_TOP_SCROLL_EDGE_HEIGHT = 160
const iOSMajorVersion = Number.parseInt(String(Platform.Version), 10)
const usesSystemScrollEdge = Platform.OS === 'ios' && iOSMajorVersion >= 26
const usesLegacyScrollEdge = Platform.OS === 'ios' && iOSMajorVersion < 26
const AnimatedLegacyScrollEdgeMask =
  Animated.createAnimatedComponent(LegacyScrollEdgeMask)

function scrollEdgeProgress(distance: number) {
  'worklet'

  const linear = Math.min(
    1,
    Math.max(0, distance / SCROLL_EDGE_TRANSITION_DISTANCE),
  )
  return linear * linear * (3 - 2 * linear)
}

// No contentInset compensation here: a -44 "cancel the transparent nav bar"
// inset was only applied by Fabric on a screen's first mount and silently
// dropped on re-push, so screens rested 44pt apart depending on navigation
// history. Resting at the full header clearance is the consistent state.
export function EdgeEffectScrollView({
  contentInset,
  headerTitleProgress,
  onContentSizeChange,
  onLayout,
  onScroll,
  ref,
  scrollIndicatorInsets,
  style,
  ...props
}: EdgeEffectScrollViewProps) {
  const paperTabBarInset = usePaperTabBarInset()
  const localBottomProgress = useSharedValue(1)
  const contentHeightRef = useRef(0)
  const viewportHeightRef = useRef(0)
  const offsetYRef = useRef(0)
  const totalBottomInset = (contentInset?.bottom ?? 0) + paperTabBarInset
  const updateBottomProgress = useCallback(
    (bottomInset = totalBottomInset) => {
      const distance =
        contentHeightRef.current +
        bottomInset -
        viewportHeightRef.current -
        offsetYRef.current
      localBottomProgress.set(scrollEdgeProgress(distance))
    },
    [localBottomProgress, totalBottomInset],
  )
  const edgeScrollHandler = useAnimatedScrollHandler(
    (event) => {
      const distance =
        event.contentSize.height +
        event.contentInset.bottom -
        event.layoutMeasurement.height -
        event.contentOffset.y
      localBottomProgress.set(scrollEdgeProgress(distance))
    },
    [localBottomProgress],
  )
  const externalOnScroll = onScroll as unknown
  const composedOnScroll = useComposedEventHandler([
    edgeScrollHandler,
    typeof externalOnScroll === 'function' ||
    externalOnScroll === null ||
    externalOnScroll === undefined
      ? null
      : (externalOnScroll as ReanimatedScrollHandler),
  ])
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        contentInset: eventInset,
        contentOffset,
        contentSize,
        layoutMeasurement,
      } = event.nativeEvent
      contentHeightRef.current = contentSize.height
      viewportHeightRef.current = layoutMeasurement.height
      offsetYRef.current = contentOffset.y
      updateBottomProgress(eventInset.bottom)
      if (typeof externalOnScroll === 'function') externalOnScroll(event)
    },
    [externalOnScroll, updateBottomProgress],
  )
  const resolvedOnScroll =
    typeof externalOnScroll === 'function' ? handleScroll : composedOnScroll

  const legacyMaskProps = useAnimatedProps(() => ({
    bottomProgress: localBottomProgress.value,
    topProgress: headerTitleProgress?.value ?? 0,
  }))
  const scrollView = (
    <Animated.ScrollView
      {...props}
      contentInsetAdjustmentBehavior="automatic"
      ref={ref}
      scrollEventThrottle={props.scrollEventThrottle ?? 16}
      style={[styles.fill, style]}
      contentInset={{
        ...contentInset,
        bottom: (contentInset?.bottom ?? 0) + paperTabBarInset,
      }}
      scrollIndicatorInsets={{
        ...scrollIndicatorInsets,
        bottom: (scrollIndicatorInsets?.bottom ?? 0) + paperTabBarInset,
      }}
      onScroll={resolvedOnScroll}
      onContentSizeChange={(width, height) => {
        contentHeightRef.current = height
        updateBottomProgress()
        onContentSizeChange?.(width, height)
      }}
      onLayout={(event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height
        updateBottomProgress()
        onLayout?.(event)
      }}
    />
  )

  const markedScrollView = (
    <ScrollViewMarker
      style={styles.fill}
      scrollEdgeEffects={
        headerTitleProgress
          ? {
              top: usesSystemScrollEdge
                ? ('automatic' as const)
                : ('hidden' as const),
            }
          : undefined
      }
    >
      {scrollView}
    </ScrollViewMarker>
  )

  return (
    <Animated.View style={styles.fill}>
      {usesLegacyScrollEdge ? (
        <AnimatedLegacyScrollEdgeMask
          animatedProps={legacyMaskProps}
          bottomProgress={1}
          style={styles.fill}
          topProgress={0}
          bottomEdgeHeight={
            paperTabBarInset > 0
              ? paperTabBarInset + PAPER_TAB_BAR_SCROLL_EDGE_BLEED
              : 0
          }
          topEdgeHeight={
            headerTitleProgress ? LEGACY_TOP_SCROLL_EDGE_HEIGHT : 0
          }
        >
          {markedScrollView}
        </AnimatedLegacyScrollEdgeMask>
      ) : (
        markedScrollView
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
