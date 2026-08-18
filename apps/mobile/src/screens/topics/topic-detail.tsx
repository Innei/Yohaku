import { Stack } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import {
  ingestTopicPage,
  refreshTopicById,
  refreshTopicBySlug,
  syncAll,
} from '@/sync/engine'
import { usePalette } from '@/theme/palette'

import {
  groupNotesByYear,
  hasMoreNotes,
  nextNoteListPage,
} from '../lists/note-timeline'
import { TopicNameRow } from './topic-chip'
import { TopicBackControl } from './topic-chrome'
import { TopicYearGroups } from './topic-year-list'
import { useTopicDetailSnapshot } from './use-topic-detail-snapshot'

export function TopicDetailScreen({
  slug,
  topicId,
}: {
  slug: string
  topicId?: string
}) {
  const locale = useLocale()
  const t = useTranslations('topic')
  const tc = useTranslations('common')
  const palette = usePalette()
  const {
    failed: snapshotFailed,
    reload: reloadSnapshot,
    snapshot,
    updatesEnabled,
  } = useTopicDetailSnapshot({ locale, slug, topicId })
  const topic = snapshot?.topic
  const topicNotes = snapshot?.notes ?? []
  const groups = useMemo(
    () => groupNotesByYear(snapshot?.notes ?? []),
    [snapshot],
  )
  const [paging, setPaging] = useState({
    fetchedPage: 0,
    slug,
    total: null as number | null,
  })
  const total = paging.slug === slug ? paging.total : null
  const fetchedPage = paging.slug === slug ? paging.fetchedPage : 0
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const loadingMoreRef = useRef(false)
  const slugRef = useRef(slug)
  slugRef.current = slug

  useEffect(() => {
    if (!updatesEnabled) return

    let cancelled = false
    const refresh = topicId
      ? Promise.all([
          refreshTopicById(topicId),
          ingestTopicPage(topicId, 1, locale),
        ]).then(([, paged]) => paged)
      : refreshTopicBySlug(slug).then((remote) =>
          ingestTopicPage(remote.id, 1, locale),
        )

    void refresh
      .then((paged) => {
        if (cancelled || slugRef.current !== slug) return
        setRefreshFailed(false)
        setPaging({
          fetchedPage: paged.pagination.page,
          slug,
          total: paged.pagination.total,
        })
      })
      .catch(() => {
        if (!cancelled) setRefreshFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt, locale, slug, topicId, updatesEnabled])

  const onEndReached = useCallback(() => {
    if (!topic || loadingMoreRef.current) return
    if (!hasMoreNotes(topicNotes.length, total)) return
    const requested = slug
    loadingMoreRef.current = true
    setLoadingMore(true)
    void ingestTopicPage(
      topic.id,
      nextNoteListPage(topicNotes.length, fetchedPage),
      locale,
    )
      .then((paged) => {
        if (slugRef.current !== requested) return
        setPaging({
          fetchedPage: paged.pagination.page,
          slug: requested,
          total: paged.pagination.total,
        })
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [fetchedPage, locale, slug, topic, topicNotes.length, total])

  const latest = topicNotes[0]?.modifiedAt ?? topicNotes[0]?.createdAt
  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(topic?.name, t('indexTitle'))
  const [refreshing, setRefreshing] = useState(false)
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

  const maybeLoadMore = useCallback(
    (distance: number) => {
      if (!topic) return
      if (contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) {
        return
      }
      if (distance > 240) return
      onEndReached()
    },
    [onEndReached, topic],
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TopicBackControl />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        headerTitleProgress={headerTitleProgress}
        scrollEventThrottle={16}
        style={styles.screen}
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
        onMomentumScrollEnd={(event) => {
          const { contentOffset, contentSize, layoutMeasurement } =
            event.nativeEvent
          maybeLoadMore(
            contentSize.height - layoutMeasurement.height - contentOffset.y,
          )
        }}
      >
        {(snapshotFailed || refreshFailed) && !topic ? (
          <AppText
            style={styles.center}
            variant="secondary"
            onPress={() => {
              void reloadSnapshot()
              setAttempt((value) => value + 1)
            }}
          >
            {tc('retry')}
          </AppText>
        ) : null}
        {topic ? (
          <View style={styles.hero} onLayout={onTitleLayout}>
            <TopicNameRow size="lg" topic={topic} />
            {topic.introduce ? (
              <AppText color={palette.neutral[7]} variant="body">
                {topic.introduce}
              </AppText>
            ) : null}
            <AppText variant="meta">
              {[
                t('noteCount', { count: total ?? topicNotes.length }),
                latest
                  ? t('updated', { time: formatRelativeTime(latest, locale) })
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </AppText>
          </View>
        ) : null}
        {topic && topicNotes.length === 0 && !loadingMore ? (
          <AppText style={styles.center} variant="secondary">
            {t('notesEmpty')}
          </AppText>
        ) : null}
        <TopicYearGroups groups={groups} />
        {loadingMore ? (
          <ActivityIndicator color={palette.neutral[5]} style={styles.more} />
        ) : null}
      </EdgeEffectScrollView>
    </View>
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
  hero: {
    gap: 8,
    marginBottom: 8,
  },
  center: {
    marginTop: 32,
    textAlign: 'center',
  },
  more: {
    marginTop: 16,
  },
})
