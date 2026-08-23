import { Stack, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'

import { ApiError } from '@/api/errors'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { openPost } from '@/lib/open-article'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { ingestTagByName, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePalette } from '@/theme/palette'

import { TaxonomyChips } from './taxonomy-chips'
import { TaxonomyBackControl } from './taxonomy-chrome'
import { crossCategoryCounts, taxonomyYearGroups } from './taxonomy-model'
import { readTagPosts } from './taxonomy-query'
import { TaxonomyPostRow, TaxonomyYearHead } from './taxonomy-year-list'

export function TagDetailScreen({ name }: { name: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('taxonomy')
  const tc = useTranslations('common')
  const tl = useTranslations('list')
  const palette = usePalette()
  const status = useSyncStatus()
  const {
    failed: snapshotFailed,
    reload: reloadSnapshot,
    snapshot,
    updatesEnabled,
  } = useDatabaseSnapshot({
    identity: `tag:${locale}:${name}`,
    read: () => readTagPosts(name, locale),
    tables: ['posts'],
  })
  const tagPosts = snapshot ?? []
  const { groupByYear, groups } = useMemo(
    () => taxonomyYearGroups(tagPosts),
    [tagPosts],
  )
  const counts = useMemo(() => crossCategoryCounts(tagPosts), [tagPosts])
  const cross = counts.length
  const subtitle =
    cross >= 2
      ? t('tagSubtitleWithCross', { count: tagPosts.length, cross })
      : t('tagSubtitleCountOnly', { count: tagPosts.length })
  const [missing, setMissing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const nameRef = useRef(name)
  nameRef.current = name

  useEffect(() => {
    if (!updatesEnabled) return
    let cancelled = false
    void ingestTagByName(name, locale)
      .then(() => {
        if (cancelled || nameRef.current !== name) return
        setMissing(false)
        setRefreshFailed(false)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (error instanceof ApiError && error.status === 404) setMissing(true)
        else setRefreshFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt, locale, name, updatesEnabled])

  const { headerTitleProgress, headerOptions, onScroll, onTitleLayout } =
    useCollapsingTitle(name, '')
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])

  const isEmpty = tagPosts.length === 0
  const showMissing = missing && isEmpty
  const showRetry = (snapshotFailed || refreshFailed) && isEmpty && !missing

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TaxonomyBackControl />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        headerTitleProgress={headerTitleProgress}
        scrollEventThrottle={16}
        style={styles.screen}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={onScroll}
      >
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
        ) : null}
        {showMissing ? (
          <AppText style={styles.center} variant="secondary">
            {t('tagMissing')}
          </AppText>
        ) : null}
        {!showMissing && !showRetry ? (
          <View style={styles.hero} onLayout={onTitleLayout}>
            <View style={styles.titleRow}>
              <AppText color={palette.accent} variant="largeTitleSans">
                #
              </AppText>
              <AppText variant="largeTitleSans">{name}</AppText>
            </View>
            <AppText variant="meta">{subtitle}</AppText>
          </View>
        ) : null}
        {(status === 'error' || refreshFailed) && !isEmpty ? (
          <AppText variant="meta">{tl('syncFailed')}</AppText>
        ) : null}
        {isEmpty && !showMissing && !showRetry ? (
          <AppText style={styles.center} variant="secondary">
            {t('tagEmpty')}
          </AppText>
        ) : null}
        {groups.map((group, index) => (
          <View key={group.year} style={index > 0 ? styles.later : undefined}>
            <TaxonomyYearHead
              count={group.items.length}
              visible={groupByYear}
              year={group.year}
            />
            {group.items.map((post) => (
              <TaxonomyPostRow
                showCategorySource
                includeYear={!groupByYear}
                key={post.id}
                post={post}
                onPress={() => openPost(router, post)}
              />
            ))}
          </View>
        ))}
        {cross >= 2 ? (
          <TaxonomyChips
            label={t('crossCategoriesLabel')}
            items={counts.map((item) => ({
              count: item.count,
              key: item.slug,
              label: item.name,
            }))}
            onPress={(slug) =>
              router.push({
                pathname: '/categories/[slug]',
                params: { slug },
              })
            }
          />
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
  },
  hero: {
    gap: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  later: {
    marginTop: 18,
  },
  center: {
    marginTop: 32,
    textAlign: 'center',
  },
})
