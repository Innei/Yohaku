import { useQuery } from '@tanstack/react-query'
import { eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  View,
} from 'react-native'

import { api } from '@/api/client'
import { ApiError } from '@/api/errors'
import type { ApiSearchNote, ApiSearchPost } from '@/api/types'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, posts, thinkings } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { secretStore } from '@/lib/secret-store'
import { siteHref } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import {
  groupSearchTimeline,
  timelineItemFromApiNote,
  timelineItemFromApiPost,
} from './group-timeline'
import {
  parseSearchScope,
  type SearchHit,
  searchNotes,
  searchPosts,
  type SearchScope,
  searchThinkings,
} from './local-search'
import { mergeHits, routableNoteHit, routablePostHit } from './merge-hits'
import {
  clearRecents,
  EMPTY_RECENTS,
  forgetRecent,
  parseRecents,
  type RecentsMap,
  rememberRecent,
  serializeRecents,
} from './recents'
import { SearchChrome } from './search-chrome'
import { SearchDock } from './search-dock'
import { SearchHitRow } from './search-hit'
import { SearchTimeline } from './search-timeline'

const RECENTS_KEY = 'yohaku.search-recents'
const DEBOUNCE_MS = 360

function loadRecents(): RecentsMap {
  try {
    return parseRecents(secretStore.getItem(RECENTS_KEY))
  } catch {
    return EMPTY_RECENTS
  }
}

function persistRecents(state: RecentsMap) {
  try {
    secretStore.setItem(RECENTS_KEY, serializeRecents(state))
  } catch {
    // preference is best-effort
  }
}

function mapRemotePost(item: ApiSearchPost): SearchHit | null {
  const route = routablePostHit(item)
  if (!route) return null
  return {
    categoryName: item.category?.name ?? null,
    categorySlug: route.categorySlug,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(0),
    id: route.id,
    isFallback: item.isFallback,
    keywords: item.highlight?.keywords ?? [],
    slug: route.slug,
    snippet: item.highlight?.snippet ?? null,
    title: item.title,
  }
}

function mapRemoteNote(item: ApiSearchNote): SearchHit | null {
  const route = routableNoteHit(item)
  if (!route) return null
  return {
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(0),
    hasPassword: route.hasPassword,
    id: route.id,
    isFallback: item.isFallback,
    keywords: item.highlight?.keywords ?? [],
    mood: item.mood,
    nid: route.nid,
    snippet: route.hasPassword ? null : (item.highlight?.snippet ?? null),
    title: item.title,
    weather: item.weather,
  }
}

function isOfflineFailure(error: unknown) {
  if (error instanceof ApiError) return false
  return !(error instanceof Error && error.name === 'AbortError')
}

function placeholderKey(scope: SearchScope) {
  if (scope === 'notes') return 'placeholderNotes' as const
  if (scope === 'thinking') return 'placeholderThinking' as const
  return 'placeholderPosts' as const
}

export function SearchScreen({ scope: rawScope }: { scope: string | string[] | undefined }) {
  const scope = parseSearchScope(rawScope)
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('search')
  const tc = useTranslations('common')
  const palette = usePalette()
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [dockHeight, setDockHeight] = useState(56)
  const [recents, setRecents] = useState(loadRecents)

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = keyword.trim()
      setDebounced(next)
      if (!next) return
      setRecents((current) => {
        const remembered = rememberRecent(current, scope, next)
        persistRecents(remembered)
        return remembered
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [keyword, scope])

  const postsQuery = useMemo(
    () => db.select().from(posts).where(eq(posts.lang, locale)),
    [locale],
  )
  const notesQuery = useMemo(
    () => db.select().from(notes).where(eq(notes.lang, locale)),
    [locale],
  )
  const thinkingsQuery = useMemo(() => db.select().from(thinkings), [])
  const { data: postRows } = useLiveQuery(postsQuery, [locale])
  const { data: noteRows } = useLiveQuery(notesQuery, [locale])
  const { data: thinkingRows } = useLiveQuery(thinkingsQuery)

  const trimmed = keyword.trim()
  const archiveEnabled = !trimmed && scope !== 'thinking'
  const archiveQuery = useQuery({
    enabled: archiveEnabled,
    queryFn: () =>
      api.archiveTimeline(scope === 'notes' ? 'notes' : 'posts', locale),
    queryKey: ['archive-timeline', scope, locale],
  })
  const localHits = useMemo(() => {
    if (!trimmed) return []
    if (scope === 'notes') return searchNotes(noteRows ?? [], trimmed)
    if (scope === 'thinking') return searchThinkings(thinkingRows ?? [], trimmed)
    return searchPosts(postRows ?? [], trimmed)
  }, [noteRows, postRows, scope, thinkingRows, trimmed])

  const remoteEnabled = scope !== 'thinking' && debounced.length > 0
  const remoteQuery = useQuery({
    enabled: remoteEnabled,
    queryFn: async (): Promise<SearchHit[]> => {
      if (scope === 'notes') {
        const page = await api.searchNotes(debounced, locale)
        return page.data
          .map(mapRemoteNote)
          .filter((item): item is SearchHit => item !== null)
      }
      const page = await api.searchPosts(debounced, locale)
      return page.data
        .map(mapRemotePost)
        .filter((item): item is SearchHit => item !== null)
    },
    queryKey: ['search', scope, debounced, locale],
  })

  const remoteHits = remoteQuery.data ?? []

  const remoteReady = remoteEnabled && debounced === trimmed
  const hits =
    remoteReady && remoteQuery.isSuccess
      ? mergeHits(localHits, remoteHits)
      : localHits

  const years = useMemo(() => {
    if (trimmed || scope === 'thinking') return []
    if (scope === 'notes') {
      return groupSearchTimeline(
        (archiveQuery.data?.notes ?? []).map(timelineItemFromApiNote),
        locale,
      )
    }
    return groupSearchTimeline(
      (archiveQuery.data?.posts ?? []).map(timelineItemFromApiPost),
      locale,
    )
  }, [archiveQuery.data, locale, scope, trimmed])

  const yearCountLabel = useCallback(
    (count: number) => t('yearTotal', { count }),
    [t],
  )

  const openHit = useCallback(
    (hit: {
      categorySlug?: string | null
      hasPassword?: boolean
      id: string
      nid?: number
      slug?: string
    }) => {
      Keyboard.dismiss()
      if (scope === 'thinking') {
        router.push(`/comments/${hit.id}`)
        return
      }
      if (scope === 'notes') {
        if (typeof hit.nid !== 'number') return
        if (hit.hasPassword) {
          void WebBrowser.openBrowserAsync(siteHref(`/notes/${hit.nid}`))
          return
        }
        router.push({
          pathname: '/notes/[nid]',
          params: { nid: String(hit.nid) },
        })
        return
      }
      if (!hit.categorySlug || !hit.slug) return
      router.push({
        pathname: '/posts/[category]/[slug]',
        params: { category: hit.categorySlug, postId: hit.id, slug: hit.slug },
      })
    },
    [router, scope],
  )

  const applyRecent = (query: string) => {
    setKeyword(query)
    setDebounced(query)
    setRecents((current) => {
      const next = rememberRecent(current, scope, query)
      persistRecents(next)
      return next
    })
  }

  const removeRecent = (query: string) => {
    setRecents((current) => {
      const next = forgetRecent(current, scope, query)
      persistRecents(next)
      return next
    })
  }

  const wipeRecents = () => {
    setRecents((current) => {
      const next = clearRecents(current, scope)
      persistRecents(next)
      return next
    })
  }

  const scopedRecents = recents[scope]
  const awaitingRemote =
    scope !== 'thinking' &&
    trimmed.length > 0 &&
    hits.length === 0 &&
    (!remoteReady || (remoteQuery.isFetching && !remoteQuery.data))
  const showLoading = awaitingRemote
  const showOffline =
    trimmed.length > 0 &&
    hits.length === 0 &&
    remoteReady &&
    remoteQuery.isError &&
    isOfflineFailure(remoteQuery.error)
  const showRetry =
    trimmed.length > 0 &&
    hits.length === 0 &&
    remoteReady &&
    remoteQuery.isError &&
    !isOfflineFailure(remoteQuery.error)
  const showEmpty =
    trimmed.length > 0 &&
    hits.length === 0 &&
    !showLoading &&
    !showOffline &&
    !showRetry &&
    (scope === 'thinking' || (remoteReady && remoteQuery.isSuccess))
  const showArchiveLoading = archiveEnabled && archiveQuery.isPending
  const showArchiveOffline =
    archiveEnabled &&
    archiveQuery.isError &&
    isOfflineFailure(archiveQuery.error)
  const showArchiveRetry =
    archiveEnabled &&
    archiveQuery.isError &&
    !isOfflineFailure(archiveQuery.error)

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <SearchChrome />
      <EdgeEffectScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        contentInset={{ bottom: dockHeight }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: dockHeight }}
        style={styles.screen}
      >
        {showLoading || showArchiveLoading ? (
          <ActivityIndicator color={palette.neutral[5]} style={styles.center} />
        ) : null}
        {showOffline || showArchiveOffline ? (
          <AppText style={styles.center} variant="secondary">
            {t('offline')}
          </AppText>
        ) : null}
        {showRetry || showArchiveRetry ? (
          <AppText
            style={styles.center}
            variant="secondary"
            onPress={() =>
              void (showArchiveRetry
                ? archiveQuery.refetch()
                : remoteQuery.refetch())
            }
          >
            {tc('retry')}
          </AppText>
        ) : null}
        {showEmpty ? (
          <View style={styles.emptyBlock}>
            <AppText style={styles.center} variant="secondary">
              {t('empty')}
            </AppText>
            <AppText style={styles.center} variant="meta">
              {t('emptyHint')}
            </AppText>
          </View>
        ) : null}

        {!trimmed && scope !== 'thinking' ? (
          <SearchTimeline
            yearCountLabel={yearCountLabel}
            years={years}
            onPressItem={openHit}
          />
        ) : null}

        {hits.map((hit) => (
          <SearchHitRow
            hit={hit}
            key={hit.id}
            scope={scope}
            onPress={() => openHit(hit)}
          />
        ))}
      </EdgeEffectScrollView>
      <SearchDock
        clearLabel={t('clear')}
        clearRecentsLabel={t('clearRecents')}
        deleteRecentLabel={t('deleteRecent')}
        placeholder={t(placeholderKey(scope))}
        recents={scopedRecents}
        value={keyword}
        onApplyRecent={applyRecent}
        onChangeText={setKeyword}
        onClear={() => {
          setKeyword('')
          setDebounced('')
        }}
        onClearRecents={wipeRecents}
        onHeight={setDockHeight}
        onRemoveRecent={removeRecent}
        onSubmit={() => Keyboard.dismiss()}
      />
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
  },
  center: {
    marginTop: 48,
    textAlign: 'center',
  },
  emptyBlock: {
    gap: 6,
  },
})
