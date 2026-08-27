import { useHeaderHeight } from 'expo-router/react-navigation'
import { useCallback, useMemo, useRef } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import {
  ReduceMotion,
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated'

import { CollapsingHeaderTitle } from '@/components/navigation/collapsing-header-title'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { collapsingTitleScrollEdgeEffects } from '@/components/navigation/top-edge-blur'
import { navTitleReveal } from '@/theme/nav-title-reveal'

import type { PresenceMark } from './presence-marks'

const HIDE_HYSTERESIS = 18

export function useCollapsingTitle(
  title: string | undefined,
  subtitle: string,
  onScrollMetrics?: (metrics: {
    contentHeight: number
    viewportHeight: number
    y: number
  }) => void,
  presenceMarks?: PresenceMark[],
  options?: {
    alwaysVisible?: boolean
    leadingInset?: number
    reserveBackClearance?: boolean
    titleFontSize?: number
    titleFontWeight?: 'bold' | 'heavy' | 'medium' | 'semibold'
  },
) {
  const alwaysVisible = options?.alwaysVisible === true
  const leadingInset = options?.leadingInset ?? 0
  const reserveBackClearance = options?.reserveBackClearance !== false
  const titleFontSize = options?.titleFontSize
  const titleFontWeight = options?.titleFontWeight
  const headerHeight = useHeaderHeight()
  const progress = useSharedValue(alwaysVisible ? 1 : 0)
  const rise = useSharedValue(alwaysVisible ? 1 : 0)
  const titleVisible = useSharedValue(alwaysVisible)
  const lastY = useSharedValue(0)
  const lastTime = useSharedValue(0)
  const velocity = useSharedValue(0)
  const readPercent = useSharedValue(0)
  const titleBottom = useSharedValue(Number.POSITIVE_INFINITY)
  const metricsRef = useRef(onScrollMetrics)
  metricsRef.current = onScrollMetrics
  const reportMetrics = useCallback(
    (y: number, contentHeight: number, viewportHeight: number) => {
      metricsRef.current?.({ contentHeight, viewportHeight, y })
    },
    [],
  )
  const trackMetrics = onScrollMetrics !== undefined

  const onScroll = useAnimatedScrollHandler(
    (event) => {
      if (!alwaysVisible) {
        const y = event.contentOffset.y
        const now = performance.now()
        if (lastTime.get() > 0) {
          const dt = Math.max(now - lastTime.get(), 1000 / 240)
          const instant = ((y - lastY.get()) / dt) * 1000
          velocity.set(velocity.get() * 0.6 + instant * 0.4)
        }
        lastY.set(y)
        lastTime.set(now)
        const crossing = titleBottom.get() - headerHeight
        const visible = titleVisible.get()
        const shouldShow = visible
          ? y > crossing - HIDE_HYSTERESIS
          : y > crossing
        if (shouldShow !== visible) {
          titleVisible.set(shouldShow)
          const target = shouldShow ? 1 : 0
          const reveal = navTitleReveal(velocity.get())
          const dampingRatio = 1 - reveal.bounce
          progress.set(
            withSpring(target, {
              dampingRatio,
              duration: reveal.fadeMs,
              reduceMotion: ReduceMotion.System,
            }),
          )
          rise.set(
            withDelay(
              reveal.riseDelayMs,
              withSpring(target, {
                dampingRatio,
                duration: reveal.riseMs,
                reduceMotion: ReduceMotion.System,
              }),
              ReduceMotion.System,
            ),
          )
        }
      }
      const contentHeight = event.contentSize.height
      if (contentHeight > 0) {
        const y = event.contentOffset.y
        const delta = Math.min(y, event.layoutMeasurement.height)
        readPercent.set(
          Math.min(Math.max(0, ((y + delta) / contentHeight) * 100), 100),
        )
      }
      if (trackMetrics) {
        runOnJS(reportMetrics)(
          event.contentOffset.y,
          event.contentSize.height,
          event.layoutMeasurement.height,
        )
      }
    },
    [alwaysVisible, headerHeight, reportMetrics, trackMetrics],
  )

  const onTitleLayout = (event: LayoutChangeEvent) => {
    const { height, y } = event.nativeEvent.layout
    titleBottom.set(y + height)
  }

  // `Stack.Title asChild` routes the custom view through the composition
  // registry, which never reaches the native header — the title silently never
  // renders. Setting `headerTitle` on Stack.Screen does reach it.
  const headerOptions = useMemo(
    () => ({
      headerBackButtonDisplayMode: 'minimal' as const,
      headerBackButtonMenuEnabled: true,
      headerBackVisible: !usesPaperNavigationControls,
      headerTitle: () =>
        title ? (
          <CollapsingHeaderTitle
            leadingInset={leadingInset}
            marks={presenceMarks}
            progress={progress}
            readPercent={readPercent}
            reserveBackClearance={reserveBackClearance}
            rise={rise}
            scrollVelocity={velocity}
            subtitle={subtitle}
            title={title}
            titleFontSize={titleFontSize}
            titleFontWeight={titleFontWeight}
            visible={titleVisible}
          />
        ) : null,
      // Keep UIKit's semantic title available for the long-press back-history
      // menu while the custom title view owns the visible header. An explicit
      // empty value also prevents Expo Router from flashing the route name
      // before the async title is available.
      title: title ?? '',
      scrollEdgeEffects: collapsingTitleScrollEdgeEffects,
    }),
    [
      leadingInset,
      presenceMarks,
      progress,
      readPercent,
      reserveBackClearance,
      rise,
      subtitle,
      title,
      titleFontSize,
      titleFontWeight,
      titleVisible,
      velocity,
    ],
  )

  return {
    headerTitleProgress: progress,
    headerOptions,
    onScroll,
    onTitleLayout,
  }
}
