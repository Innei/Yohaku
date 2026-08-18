import { useHeaderHeight } from 'expo-router/react-navigation'
import { useCallback, useMemo, useRef } from 'react'
import type { LayoutChangeEvent } from 'react-native'
import {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated'

import { CollapsingHeaderTitle } from '@/components/navigation/collapsing-header-title'
import {
  usesPaperNavigationControls,
  usesSystemNavigationAppearance,
} from '@/components/navigation/platform'

import type { PresenceMark } from './presence-marks'

const FADE_BAND = 32

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
        const crossing = titleBottom.get() - headerHeight
        const traveled = event.contentOffset.y - (crossing - FADE_BAND / 2)
        progress.set(Math.min(1, Math.max(0, traveled / FADE_BAND)))
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
            subtitle={subtitle}
            title={title}
            titleFontSize={titleFontSize}
            titleFontWeight={titleFontWeight}
          />
        ) : null,
      // Keep UIKit's semantic title available for the long-press back-history
      // menu while the custom title view owns the visible header. An explicit
      // empty value also prevents Expo Router from flashing the route name
      // before the async title is available.
      title: title ?? '',
      scrollEdgeEffects: {
        bottom: 'automatic' as const,
        top: usesSystemNavigationAppearance
          ? ('automatic' as const)
          : ('hidden' as const),
      },
    }),
    [
      leadingInset,
      presenceMarks,
      progress,
      readPercent,
      reserveBackClearance,
      subtitle,
      title,
      titleFontSize,
      titleFontWeight,
    ],
  )

  return {
    headerTitleProgress: progress,
    headerOptions,
    onScroll,
    onTitleLayout,
  }
}
