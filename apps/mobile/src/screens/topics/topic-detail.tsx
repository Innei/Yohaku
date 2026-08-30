import { Stack } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { articleIdsFromVisible } from '@/screens/lists/flatten-posts-list'
import {
  groupNotesByYear,
  hasMoreNotes,
  nextNoteListPage,
} from '@/screens/lists/note-timeline'
import {
  ingestTopicPage,
  refreshTopicById,
  refreshTopicBySlug,
  syncAll,
} from '@/sync/engine'
import { useListBodyIngest } from '@/sync/use-list-body-ingest'
import { usePalette } from '@/theme/palette'

import {
  flattenTopicList,
  TOPIC_CHROME_ID,
  TOPIC_EMPTY_ID,
  TOPIC_FOOTER_ID,
  yearFromTopicItemId,
} from './flatten-topic-list'
import { TopicNameRow } from './topic-chip'
import { TopicBackControl } from './topic-chrome'
import { TopicNoteRow, TopicYearHead } from './topic-year-list'
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
  const tabBarInset = usePaperTabBarInset()
  const {
    failed: snapshotFailed,
    reload: reloadSnapshot,
    snapshot,
    updatesEnabled,
  } = useTopicDetailSnapshot({ locale, slug, topicId })
  const topic = snapshot?.topic
  const topicNotes = snapshot?.notes ?? []
  const [visibleIds, setVisibleIds] = useState<string[] | undefined>(undefined)
  useListBodyIngest(
    topicNotes.map((note) => ({
      id: note.id,
      kind: 'note' as const,
      bodyVersion: note.bodyVersion,
      contentFormat: note.contentFormat,
      createdAt: note.createdAt,
      hasPassword: note.hasPassword,
      modifiedAt: note.modifiedAt,
    })),
    { visibleIds },
  )
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
  const { headerOptions, onNativeScroll, onTitleLayout } = useCollapsingTitle(
    topic?.name,
    t('indexTitle'),
  )
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])

  const notesById = useMemo(() => {
    const map = new Map(topicNotes.map((note) => [note.id, note]))
    return map
  }, [topicNotes])
  const listItems = useMemo(
    () =>
      flattenTopicList({
        groups,
        loadingMore,
        showEmpty: Boolean(topic) && topicNotes.length === 0 && !loadingMore,
      }),
    [groups, loadingMore, topic, topicNotes.length],
  )
  const showRetry = (snapshotFailed || refreshFailed) && !topic

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TopicBackControl />
      {showRetry ? (
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
      ) : (
        <YohakuList
          contentInsetBottom={tabBarInset}
          items={listItems}
          refreshing={refreshing}
          style={styles.screen}
          renderItem={(item) => {
            if (item.id === TOPIC_CHROME_ID) {
              if (!topic) return null
              return (
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
                        ? t('updated', {
                            time: formatRelativeTime(latest, locale),
                          })
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </AppText>
                </View>
              )
            }
            if (item.id === TOPIC_EMPTY_ID) {
              return (
                <AppText style={styles.center} variant="secondary">
                  {t('notesEmpty')}
                </AppText>
              )
            }
            if (item.id === TOPIC_FOOTER_ID) {
              return (
                <ActivityIndicator
                  color={palette.neutral[5]}
                  style={styles.more}
                />
              )
            }
            if (item.type === 'year') {
              const year = yearFromTopicItemId(item.id)
              const group = groups.find((entry) => entry.year === year)
              if (!group) return null
              return (
                <TopicYearHead
                  count={group.notes.length}
                  later={group !== groups[0]}
                  year={group.year}
                />
              )
            }
            const note = notesById.get(item.id)
            if (!note) return null
            return <TopicNoteRow note={note} />
          }}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          onScroll={onNativeScroll}
          onVisibleItems={(items) =>
            setVisibleIds(articleIdsFromVisible(items, ['note']))
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
