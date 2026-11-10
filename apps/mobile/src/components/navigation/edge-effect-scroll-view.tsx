import {
  LegacyScrollEdgeMask,
  VariableBlurEdge,
  YohakuScrollAttachment,
} from '@modules/yohaku'
import { useHeaderHeight } from 'expo-router/react-navigation'
import type { Ref } from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useCallback, useRef } from 'react'
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
  ScrollViewProps,
} from 'react-native'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedScrollHandler,
  useComposedEventHandler,
  useSharedValue,
} from 'react-native-reanimated'
import { ScrollViewMarkerCompat as ScrollViewMarker } from '@/components/navigation/scroll-view-marker'

import { usePalette } from '@/theme/palette'

import {
  PAPER_TAB_BAR_SCROLL_EDGE_BLEED,
  usePaperTabBarInset,
} from './paper-tab-bar-inset'
import { pageScrollEdgeEffects } from './scroll-edges'
import { topBlurOverlayHeight } from './top-edge-blur'

type ReanimatedScrollHandler = ReturnType<typeof useAnimatedScrollHandler>
type EdgeEffectScrollViewProps = ScrollViewProps & {
  /**
   * Android keeps the transparent native header out of layout, so scroll
   * content has to clear it manually. Cover/hero screens that intentionally
   * bleed under the header opt out.
   */
  androidHeaderInset?: boolean
  headerTitleProgress?: SharedValue<number>
  ref?: Ref<ScrollViewInstance>
}

const SCROLL_EDGE_TRANSITION_DISTANCE = 32
const iOSMajorVersion = Number.parseInt(String(Platform.Version), 10)
const usesLegacyScrollEdge = Platform.OS === 'ios' && iOSMajorVersion < 26
const AnimatedLegacyScrollEdgeMask =
  Animated.createAnimatedComponent(LegacyScrollEdgeMask)
const AnimatedVariableBlurEdge =
  Animated.createAnimatedComponent(VariableBlurEdge)

export function scrollEdgeProgress(distance: number) {
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
  androidHeaderInset = true,
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
  const palette = usePalette()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
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
    topProgress: 0,
  }))
  const topBlurProps = useAnimatedProps(() => ({
    progress: headerTitleProgress?.value ?? 0,
  }))
  const overlayHeight = topBlurOverlayHeight(headerHeight)
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
      // `contentInset` is iOS-only: Android scroll views need the same space as
      // real content padding or the tab bar covers the last paragraph.
      contentContainerStyle={[
        props.contentContainerStyle,
        Platform.OS === 'android'
          ? {
              paddingBottom:
                (contentInset?.bottom ?? 0) + paperTabBarInset,
              paddingTop: androidHeaderInset
                ? headerHeight +
                  3 +
                  (Number(
                    StyleSheet.flatten(props.contentContainerStyle)?.paddingTop,
                  ) || 0)
                : undefined,
            }
          : null,
      ]}
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
    >
      {props.children}
      <YohakuScrollAttachment style={styles.attachment} />
    </Animated.ScrollView>
  )

  const markedScrollView = (
    <ScrollViewMarker
      scrollEdgeEffects={pageScrollEdgeEffects(Boolean(headerTitleProgress))}
      style={styles.fill}
    >
      {scrollView}
    </ScrollViewMarker>
  )

  const topBlur = headerTitleProgress ? (
    <AnimatedVariableBlurEdge
      animatedProps={topBlurProps}
      pointerEvents="none"
      progress={headerTitleProgress.get()}
      readabilityColor={palette.surface.desk}
      style={[styles.topBlur, { height: overlayHeight }]}
    />
  ) : null

  // Transparent native headers do not paint over scrolling content on Android,
  // so the paper scrim has to cover the status bar + header band itself. The
  // liquid-glass band is used on list screens only: inside this scroll view the
  // backdrop capture blanks the whole screen on API 33+.
  const androidScrimHeight = Math.max(headerHeight, insets.top + 56) + 12
  const androidScrim =
    Platform.OS === 'android' ? (
      <View
        pointerEvents="none"
        style={[styles.topBlur, { height: androidScrimHeight }]}
      >
        <View
          style={{
            backgroundColor: palette.surface.desk,
            height: Math.max(0, androidScrimHeight - 20),
          }}
        />
        <Svg height={20} width="100%">
          <Defs>
            <LinearGradient id="scrim-fade" x1="0" x2="0" y1="0" y2="1">
              <Stop
                offset="0"
                stopColor={palette.surface.desk}
                stopOpacity={1}
              />
              <Stop
                offset="1"
                stopColor={palette.surface.desk}
                stopOpacity={0}
              />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#scrim-fade)" height={20} width="100%" />
        </Svg>
      </View>
    ) : null

  return (
    <Animated.View style={styles.fill}>
      {usesLegacyScrollEdge ? (
        <AnimatedLegacyScrollEdgeMask
          animatedProps={legacyMaskProps}
          bottomProgress={1}
          style={styles.fill}
          topEdgeHeight={0}
          topProgress={0}
          bottomEdgeHeight={
            paperTabBarInset > 0
              ? paperTabBarInset + PAPER_TAB_BAR_SCROLL_EDGE_BLEED
              : 0
          }
        >
          {markedScrollView}
        </AnimatedLegacyScrollEdgeMask>
      ) : (
        markedScrollView
      )}
      {topBlur}
      {androidScrim}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  attachment: { position: 'absolute', width: 0, height: 0 },
  fill: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBlur: {
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
