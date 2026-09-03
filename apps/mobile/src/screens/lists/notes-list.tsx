import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Stack, useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, topics } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { openNote } from '@/lib/open-article'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { ingestNotePage, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { useListBodyIngest } from '@/sync/use-list-body-ingest'
import { usePalette } from '@/theme/palette'

import { ListSearchToolbar } from '../search/search-chrome'
import { topicById } from '../topics/topic-list'
import {
  flattenNotesList,
  NOTE_LIST_FOOTER_ID,
  NOTE_LIST_RULE_ID,
  yearFromNoteItemId,
} from './flatten-notes-list'
import { articleIdsFromVisible } from './flatten-posts-list'
import {
  NOTE_LATEST_HERO_HEIGHT,
  noteCoverPlaceholderUri,
  noteCoverUrl,
} from './note-cover'
import { NoteLatest } from './note-latest'
import {
  groupNotesByYear,
  hasMoreNotes,
  nextNoteListPage,
  splitLatestNote,
} from './note-timeline'
import {
  NotesOlderRule,
  NoteTimelineRow,
  NoteYearHead,
} from './note-timeline-rows'

function NotesTrailingToolbar() {
  const router = useRouter()
  const t = useTranslations('topic')
  const tc = useTranslations('common')
  const palette = usePalette()
  const openSeries = () => router.push('/series')

  return (
    <ListSearchToolbar
      scope="notes"
      trailingPaper={
        <PaperNavigationControl
          accessibilityLabel={tc('more')}
          icon="ellipsis"
          identifier="notes-more"
          menuItems={[
            { id: 'series', icon: 'square.stack', title: t('indexTitle') },
          ]}
          onMenuAction={(id) => {
            if (id === 'series') openSeries()
          }}
        />
      }
      trailingSystem={
        <Stack.Toolbar.Menu
          accessibilityLabel={tc('more')}
          icon="ellipsis"
          tintColor={palette.neutral[9]}
        >
          <Stack.Toolbar.MenuAction icon="square.stack" onPress={openSeries}>
            {t('indexTitle')}
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      }
    />
  )
}

export function NotesListScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('list')
  const tt = useTranslations('tabs')
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()
  const status = useSyncStatus()
  const [refreshing, setRefreshing] = useState(false)
  const query = useMemo(
    () =>
      db
        .select()
        .from(notes)
        .where(eq(notes.lang, locale))
        .orderBy(desc(notes.createdAt)),
    [locale],
  )
  const { data } = useLiveQuery(query, [locale])
  const topicsQuery = useMemo(
    () => db.select().from(topics).where(eq(topics.lang, locale)),
    [locale],
  )
  const { data: topicRows } = useLiveQuery(topicsQuery, [locale])
  const notesInLocale = useMemo(() => data ?? [], [data])
  const topicRowsInDb = topicRows ?? []
  const { latest, older } = useMemo(
    () => splitLatestNote(notesInLocale),
    [notesInLocale],
  )
  const groups = useMemo(() => groupNotesByYear(older), [older])
  const [visibleIds, setVisibleIds] = useState<string[] | undefined>()
  const { headerOptions, onNativeScroll } = useCollapsingTitle(
    tt('notes'),
    '',
    undefined,
    undefined,
    {
      alwaysVisible: true,
      leadingInset: 20,
      reserveBackClearance: false,
      titleFontSize: 18,
      titleFontWeight: 'bold',
    },
  )
  const [paging, setPaging] = useState({
    fetchedPage: 0,
    locale,
    total: null as number | null,
  })
  const total = paging.locale === locale ? paging.total : null
  const fetchedPage = paging.locale === locale ? paging.fetchedPage : 0
  const [loadingMore, setLoadingMore] = useState(false)
  const loadingMoreRef = useRef(false)
  const localeRef = useRef(locale)
  localeRef.current = locale

  useListBodyIngest(
    notesInLocale.map((note) => ({
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

  const listItems = useMemo(
    () =>
      flattenNotesList({
        groups,
        latestId: latest?.id ?? null,
        loadingMore,
      }),
    [groups, latest?.id, loadingMore],
  )
  const notesById = useMemo(
    () => new Map(notesInLocale.map((note) => [note.id, note])),
    [notesInLocale],
  )

  const onEndReached = useCallback(() => {
    const loaded = notesInLocale.length
    if (loadingMoreRef.current || !hasMoreNotes(loaded, total)) return
    const requestedLocale = locale
    loadingMoreRef.current = true
    setLoadingMore(true)
    void ingestNotePage(nextNoteListPage(loaded, fetchedPage), requestedLocale)
      .then((paged) => {
        if (localeRef.current !== requestedLocale) return
        setPaging({
          fetchedPage: paged.pagination.page,
          locale: requestedLocale,
          total: paged.pagination.total,
        })
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [fetchedPage, locale, notesInLocale.length, total])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])

  const isEmpty = notesInLocale.length === 0
  const coverUri = latest ? noteCoverUrl(latest) : null
  const coverPlaceholderUri = noteCoverPlaceholderUri(latest?.coverThumbhash)

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <NotesTrailingToolbar />
      {status === 'error' && !isEmpty ? (
        <AppText style={styles.syncFailed} variant="meta">
          {t('syncFailed')}
        </AppText>
      ) : null}
      {isEmpty ? (
        <AppText style={styles.empty} variant="secondary">
          {status === 'syncing' ? t('syncing') : t('empty')}
        </AppText>
      ) : (
        <YohakuList
          contentInsetBottom={tabBarInset}
          items={listItems}
          refreshing={refreshing}
          stretchCoverHeight={NOTE_LATEST_HERO_HEIGHT}
          stretchCoverPlaceholderUri={coverPlaceholderUri}
          stretchCoverUri={coverUri}
          style={styles.screen}
          renderItem={(item) => {
            if (item.id === NOTE_LIST_RULE_ID) return <NotesOlderRule />
            if (item.id === NOTE_LIST_FOOTER_ID) {
              return (
                <ActivityIndicator
                  color={palette.neutral[5]}
                  style={styles.more}
                />
              )
            }
            if (item.type === 'latest' && latest) {
              return (
                <NoteLatest
                  note={latest}
                  topic={topicById(topicRowsInDb, latest.topicId)}
                  onOpen={() => openNote(router, latest)}
                />
              )
            }
            if (item.type === 'year') {
              const year = yearFromNoteItemId(item.id)
              const group = groups.find((entry) => entry.year === year)
              return group ? (
                <NoteYearHead
                  count={group.notes.length}
                  later={group !== groups[0]}
                  year={group.year}
                />
              ) : null
            }
            const note = notesById.get(item.id)
            return note ? (
              <NoteTimelineRow
                note={note}
                topic={topicById(topicRowsInDb, note.topicId)}
              />
            ) : null
          }}
          onEndReached={onEndReached}
          onRefresh={onRefresh}
          onScroll={onNativeScroll}
          onVisibleItems={(items) =>
            setVisibleIds(articleIdsFromVisible(items, ['latest', 'note']))
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
  empty: {
    marginTop: 48,
    textAlign: 'center',
  },
  more: {
    marginTop: 16,
  },
  syncFailed: {
    marginHorizontal: 20,
    marginTop: 8,
  },
})
