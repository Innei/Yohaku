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
import { pickFeaturedPost } from '@/screens/lists/post-list'
import { ingestCategoryBySlug, syncAll } from '@/sync/engine'
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
import {
  categoryDisplayName,
  categoryShowsYear,
  earliestPostYear,
  sumTags,
  taxonomyYearGroups,
} from './taxonomy-model'
import { TaxonomyPinned } from './taxonomy-pinned'
import { readCategoryPosts } from './taxonomy-query'
import { TaxonomyYearHead } from './taxonomy-year-list'

export function CategoryDetailScreen({ slug }: { slug: string }) {
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
    identity: `category:${locale}:${slug}`,
    read: () => readCategoryPosts(slug, locale),
    tables: ['posts', 'categories'],
  })
  const postsInCategory = snapshot?.posts ?? []
  const [visibleIds, setVisibleIds] = useState<string[] | undefined>(undefined)
  useListBodyIngest(
    postsInCategory.map((post) => ({
      id: post.id,
      kind: 'post' as const,
      bodyVersion: post.bodyVersion,
      contentFormat: post.contentFormat,
      createdAt: post.createdAt,
      modifiedAt: post.modifiedAt,
    })),
    { visibleIds },
  )
  const { featured, rest } = useMemo(
    () => pickFeaturedPost(postsInCategory),
    [postsInCategory],
  )
  const { groupByYear, groups } = useMemo(
    () => taxonomyYearGroups(rest),
    [rest],
  )
  const name = categoryDisplayName(snapshot?.category, postsInCategory, slug)
  const count = postsInCategory.length
  const earliestYear = earliestPostYear(postsInCategory)
  const showYear = categoryShowsYear(
    count,
    earliestYear,
    new Date().getFullYear(),
  )
  const subtitle = showYear
    ? t('categorySubtitleWithYear', { count, year: earliestYear ?? '' })
    : t('categorySubtitleCountOnly', { count })
  const tags = useMemo(() => sumTags(postsInCategory), [postsInCategory])
  const [missing, setMissing] = useState(false)
  const [refreshFailed, setRefreshFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const slugRef = useRef(slug)
  slugRef.current = slug

  useEffect(() => {
    if (!updatesEnabled) return
    let cancelled = false
    void ingestCategoryBySlug(slug, locale)
      .then(() => {
        if (cancelled || slugRef.current !== slug) return
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
  }, [attempt, locale, slug, updatesEnabled])

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
    const map = new Map(postsInCategory.map((post) => [post.id, post]))
    return map
  }, [postsInCategory])
  const isEmpty = postsInCategory.length === 0
  const showMissing = missing && isEmpty
  const showRetry = (snapshotFailed || refreshFailed) && isEmpty && !missing
  const listItems = useMemo(
    () =>
      flattenTaxonomyList({
        featuredId: featured?.id ?? null,
        groupByYear,
        groups,
        locale,
        showChips: tags.length > 0,
        showCategorySource: false,
        showEmpty: isEmpty && !showMissing && !showRetry,
      }),
    [
      featured,
      groupByYear,
      groups,
      isEmpty,
      locale,
      showMissing,
      showRetry,
      tags.length,
    ],
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
          {t('categoryMissing')}
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
                  <AppText variant="largeTitleSans">{name}</AppText>
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
                  {t('categoryEmpty')}
                </AppText>
              )
            }
            if (item.id === TAXONOMY_CHIPS_ID) {
              return (
                <TaxonomyChips
                  label={t('subTagsLabel')}
                  items={tags.map((tag) => ({
                    count: tag.count,
                    key: tag.name,
                    label: `#${tag.name}`,
                  }))}
                  onPress={(name) =>
                    router.push({
                      pathname: '/posts/tag/[name]',
                      params: { name },
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
            if (item.type === 'post') return null
            const post = postsById.get(item.id)
            if (!post) return null
            if (item.type === 'featured') {
              return (
                <TaxonomyPinned
                  includeYear={!groupByYear}
                  post={post}
                  onPress={() => openPost(router, post)}
                />
              )
            }
            return null
          }}
          onRefresh={onRefresh}
          onScroll={onNativeScroll}
          onItemPress={({ id }) => {
            const post = postsById.get(id)
            if (post) openPost(router, post)
          }}
          onLinkPress={(kind, value) => {
            if (kind === 'tag') {
              router.push({
                pathname: '/posts/tag/[name]',
                params: { name: value },
              })
            }
          }}
          onVisibleItems={(items) =>
            setVisibleIds(articleIdsFromVisible(items, ['featured', 'post']))
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
  center: {
    marginTop: 32,
    textAlign: 'center',
  },
})
