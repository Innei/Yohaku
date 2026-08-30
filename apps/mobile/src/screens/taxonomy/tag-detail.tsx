import { Stack, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { ApiError } from '@/api/errors'
import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { openPost } from '@/lib/open-article'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { articleIdsFromVisible } from '@/screens/lists/flatten-posts-list'
import { ingestTagByName, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { useListBodyIngest } from '@/sync/use-list-body-ingest'
import { usePalette } from '@/theme/palette'

import {
  flattenTaxonomyList,
  TAXONOMY_CHIPS_ID,
  TAXONOMY_CHROME_ID,
  TAXONOMY_EMPTY_ID,
  yearFromTaxonomyItemId,
} from './flatten-taxonomy-list'
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
  const tabBarInset = usePaperTabBarInset()
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
  const [visibleIds, setVisibleIds] = useState<string[] | undefined>(undefined)
  useListBodyIngest(
    tagPosts.map((post) => ({
      id: post.id,
      kind: 'post' as const,
      bodyVersion: post.bodyVersion,
      contentFormat: post.contentFormat,
      createdAt: post.createdAt,
      modifiedAt: post.modifiedAt,
    })),
    { visibleIds },
  )
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

  const { headerOptions, onNativeScroll, onTitleLayout } = useCollapsingTitle(
    name,
    '',
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

  const postsById = useMemo(() => {
    const map = new Map(tagPosts.map((post) => [post.id, post]))
    return map
  }, [tagPosts])
  const isEmpty = tagPosts.length === 0
  const showMissing = missing && isEmpty
  const showRetry = (snapshotFailed || refreshFailed) && isEmpty && !missing
  const listItems = useMemo(
    () =>
      flattenTaxonomyList({
        featuredId: null,
        groupByYear,
        groups,
        showChips: cross >= 2,
        showEmpty: isEmpty && !showMissing && !showRetry,
      }),
    [cross, groupByYear, groups, isEmpty, showMissing, showRetry],
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TaxonomyBackControl />
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
        <YohakuList
          contentInsetBottom={tabBarInset}
          items={listItems}
          refreshing={refreshing}
          style={styles.screen}
          renderItem={(item) => {
            if (item.id === TAXONOMY_CHROME_ID) {
              return (
                <View style={styles.hero} onLayout={onTitleLayout}>
                  <View style={styles.titleRow}>
                    <AppText color={palette.accent} variant="largeTitleSans">
                      #
                    </AppText>
                    <AppText variant="largeTitleSans">{name}</AppText>
                  </View>
                  <AppText variant="meta">{subtitle}</AppText>
                  {(status === 'error' || refreshFailed) && !isEmpty ? (
                    <AppText variant="meta">{tl('syncFailed')}</AppText>
                  ) : null}
                </View>
              )
            }
            if (item.id === TAXONOMY_EMPTY_ID) {
              return (
                <AppText style={styles.center} variant="secondary">
                  {t('tagEmpty')}
                </AppText>
              )
            }
            if (item.id === TAXONOMY_CHIPS_ID) {
              return (
                <TaxonomyChips
                  label={t('crossCategoriesLabel')}
                  items={counts.map((entry) => ({
                    count: entry.count,
                    key: entry.slug,
                    label: entry.name,
                  }))}
                  onPress={(slug) =>
                    router.push({
                      pathname: '/categories/[slug]',
                      params: { slug },
                    })
                  }
                />
              )
            }
            if (item.type === 'year') {
              const year = yearFromTaxonomyItemId(item.id)
              const group = groups.find((entry) => entry.year === year)
              if (!group) return null
              return (
                <TaxonomyYearHead
                  count={group.items.length}
                  later={group !== groups[0]}
                  visible={groupByYear}
                  year={group.year}
                />
              )
            }
            const post = postsById.get(item.id)
            if (!post) return null
            return (
              <TaxonomyPostRow
                showCategorySource
                includeYear={!groupByYear}
                post={post}
                onPress={() => openPost(router, post)}
              />
            )
          }}
          onRefresh={onRefresh}
          onScroll={onNativeScroll}
          onVisibleItems={(items) =>
            setVisibleIds(articleIdsFromVisible(items, ['post']))
          }
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    gap: 8,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  center: {
    marginTop: 32,
    textAlign: 'center',
  },
})
