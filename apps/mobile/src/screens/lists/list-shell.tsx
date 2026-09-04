import type { ReactNode } from 'react'
import { useCallback, useRef, useState } from 'react'
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, type TextRole } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePalette } from '@/theme/palette'

const endReachedOffset = 240

export function ListShell({
  eyebrow,
  title,
  titleVariant = 'largeTitle',
  isEmpty,
  onEndReached,
  children,
}: {
  eyebrow?: string
  title?: string
  titleVariant?: Extract<TextRole, 'largeTitle' | 'largeTitleSans'>
  isEmpty: boolean
  onEndReached?: () => void
  children?: ReactNode
}) {
  const t = useTranslations('list')
  const palette = usePalette()
  const status = useSyncStatus()
  const [refreshing, setRefreshing] = useState(false)
  const onEndReachedRef = useRef(onEndReached)
  onEndReachedRef.current = onEndReached
  const canLoadMoreRef = useRef(Boolean(onEndReached) && !isEmpty)
  canLoadMoreRef.current = Boolean(onEndReached) && !isEmpty
  const viewportHeightRef = useRef(0)
  const contentHeightRef = useRef(0)

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])

  const maybeLoadMore = useCallback((distance: number) => {
    if (!canLoadMoreRef.current) return
    if (contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) return
    if (distance <= endReachedOffset) onEndReachedRef.current?.()
  }, [])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent
      if (contentSize.height <= 0) return
      maybeLoadMore(
        contentSize.height - layoutMeasurement.height - contentOffset.y,
      )
    },
    [maybeLoadMore],
  )

  return (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onScroll={onScroll}
      onContentSizeChange={(_, height) => {
        contentHeightRef.current = height
        maybeLoadMore(height - viewportHeightRef.current)
      }}
      onLayout={(event) => {
        viewportHeightRef.current = event.nativeEvent.layout.height
        maybeLoadMore(contentHeightRef.current - viewportHeightRef.current)
      }}
    >
      {eyebrow || title ? (
        <View style={styles.header}>
          {eyebrow ? (
            <AppText style={styles.eyebrow} variant="eyebrow">
              {eyebrow}
            </AppText>
          ) : null}
          {title ? <AppText variant={titleVariant}>{title}</AppText> : null}
        </View>
      ) : null}
      {isEmpty ? (
        <AppText style={styles.empty} variant="secondary">
          {status === 'syncing' ? t('syncing') : t('empty')}
        </AppText>
      ) : (
        children
      )}
    </EdgeEffectScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
  },
})
