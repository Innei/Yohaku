import { type as typeScale } from '@yohaku/design-system/tokens'
import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { Stack, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'

import { primeArticleBody } from '@/components/dom/prime-body'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import type { NoteRow } from '@/db/schema'
import { notes, topics } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatNoteListDate } from '@/lib/datetime'
import { siteHref } from '@/lib/site-url'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { ingestNotePage, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { ListSearchToolbar } from '../search/search-chrome'
import { TopicChip } from '../topics/topic-chip'
import { topicById } from '../topics/topic-list'
import { NoteLatest } from './note-latest'
import {
  groupNotesByYear,
  hasMoreNotes,
  letterCountLabel,
  nextNoteListPage,
  splitLatestNote,
} from './note-timeline'

function openNote(note: NoteRow, router: ReturnType<typeof useRouter>) {
  const webUrl = siteHref(`/notes/${note.nid}`)
  if (note.hasPassword || note.contentFormat === 'markdown') {
    void WebBrowser.openBrowserAsync(webUrl)
    return
  }
  if (note.contentFormat === 'lexical' && note.content) {
    primeArticleBody({
      content: note.content,
      enrichments: note.enrichments ?? undefined,
      key: note.id,
      variant: 'note',
      webUrl,
    })
  }
  router.push({
    pathname: '/notes/[nid]',
    params: { nid: String(note.nid) },
  })
}

function moodLine(note: NoteRow): string {
  return [note.weather, note.mood].filter(Boolean).join(' · ')
}

const topicsQuery = db.select().from(topics)

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
  const serifFont = useNativeSerifFontStyle()
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
  const { data: topicRows } = useLiveQuery(topicsQuery)
  const notesInLocale = data ?? []
  const topicRowsInDb = topicRows ?? []
  const { latest, older } = useMemo(() => splitLatestNote(data ?? []), [data])
  const groups = useMemo(() => groupNotesByYear(older), [older])
  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(tt('notes'), '', undefined, undefined, {
      alwaysVisible: true,
      leadingInset: 20,
      reserveBackClearance: false,
      titleFontSize: 18,
      titleFontWeight: 'bold',
    })
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
  const viewportHeightRef = useRef(0)
  const contentHeightRef = useRef(0)

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
  const maybeLoadMore = useCallback(
    (distance: number) => {
      if (isEmpty) return
      if (contentHeightRef.current <= 0 || viewportHeightRef.current <= 0) {
        return
      }
      if (distance > 240) return
      onEndReached()
    },
    [isEmpty, onEndReached],
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <NotesTrailingToolbar />
      <EdgeEffectScrollView
        alwaysBounceVertical
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
        {status === 'error' && !isEmpty ? (
          <AppText variant="meta">{t('syncFailed')}</AppText>
        ) : null}
        {isEmpty ? (
          <AppText style={styles.empty} variant="secondary">
            {status === 'syncing' ? t('syncing') : t('empty')}
          </AppText>
        ) : null}
        {latest ? (
          <NoteLatest
            note={latest}
            topic={topicById(topicRowsInDb, latest.topicId)}
            onOpen={() => openNote(latest, router)}
            onTitleLayout={onTitleLayout}
          />
        ) : null}
        {groups.length > 0 ? (
          <View>
            <View style={styles.rule}>
              <View
                style={[
                  styles.ruleLine,
                  { backgroundColor: palette.neutral[3] },
                ]}
              />
              <AppText
                color={palette.neutral[6]}
                style={styles.ruleLabel}
                variant="eyebrow"
              >
                {t('olderNotes')}
              </AppText>
              <View
                style={[
                  styles.ruleLine,
                  { backgroundColor: palette.neutral[3] },
                ]}
              />
            </View>
            {groups.map((group, groupIndex) => (
              <View
                key={group.year}
                style={groupIndex > 0 ? styles.laterYear : undefined}
              >
                <View
                  style={[
                    styles.yearHead,
                    { borderBottomColor: palette.neutral[3] },
                  ]}
                >
                  <View>
                    <AppText
                      color={palette.semantic.warning}
                      style={[styles.anno, serifFont]}
                      variant="eyebrow"
                    >
                      Anno
                    </AppText>
                    <AppText style={styles.yearNum} variant="largeTitle">
                      {group.year}
                    </AppText>
                  </View>
                  <AppText style={styles.yearCount} variant="eyebrow">
                    {letterCountLabel(group.notes.length)}
                  </AppText>
                </View>
                <View>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.spine,
                      { backgroundColor: palette.neutral[3] },
                    ]}
                  />
                  {group.notes.map((note) => {
                    const mood = moodLine(note)
                    const topic = topicById(topicRowsInDb, note.topicId)
                    return (
                      <View key={note.id} style={styles.entry}>
                        <NativePressable
                          style={styles.press}
                          onPress={() => openNote(note, router)}
                        >
                          <View style={styles.dateRow}>
                            <View
                              pointerEvents="none"
                              style={[
                                styles.dot,
                                {
                                  backgroundColor: palette.surface.desk,
                                  borderColor: palette.neutral[4],
                                },
                              ]}
                            />
                            <AppText style={styles.stackDate} variant="eyebrow">
                              {formatNoteListDate(note.createdAt, locale)}
                            </AppText>
                          </View>
                          <AppText variant="letterTitle">{note.title}</AppText>
                          {mood ? (
                            <AppText
                              color={palette.neutral[7]}
                              style={styles.mood}
                              variant="meta"
                            >
                              {mood}
                            </AppText>
                          ) : null}
                          <View style={styles.letterMeta}>
                            {note.hasPassword ? (
                              <SymbolView
                                name="lock.fill"
                                size={10}
                                tintColor={palette.semantic.warning}
                              />
                            ) : null}
                            <AppText
                              color={palette.semantic.warning}
                              style={styles.letterNo}
                              variant="eyebrow"
                            >
                              {`Letter №${note.nid}`}
                            </AppText>
                          </View>
                        </NativePressable>
                        {topic ? <TopicChip topic={topic} /> : null}
                      </View>
                    )
                  })}
                </View>
              </View>
            ))}
          </View>
        ) : null}
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 28,
  },
  ruleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  ruleLabel: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  laterYear: {
    marginTop: 40,
  },
  yearHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 10,
    marginBottom: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  anno: {
    letterSpacing: 2.8,
  },
  yearNum: {
    marginTop: 2,
    fontSize: typeScale.display36.size,
    lineHeight: typeScale.display36.lineHeight,
    letterSpacing: -0.6,
  },
  yearCount: {
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  spine: {
    position: 'absolute',
    left: 7,
    top: 8,
    bottom: 8,
    width: StyleSheet.hairlineWidth,
  },
  entry: {
    position: 'relative',
    paddingLeft: 22,
    paddingBottom: 20,
  },
  press: {
    overflow: 'visible',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginLeft: -18,
    marginBottom: 4,
  },
  dot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  stackDate: {
    letterSpacing: 1.6,
  },
  mood: {
    marginTop: 6,
  },
  letterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  letterNo: {
    letterSpacing: 2.2,
  },
  more: {
    marginTop: 16,
  },
})
