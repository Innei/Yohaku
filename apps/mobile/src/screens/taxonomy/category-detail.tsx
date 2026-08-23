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
import { pickFeaturedPost } from '@/screens/lists/post-list'
import { ingestCategoryBySlug, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePalette } from '@/theme/palette'

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
import { TaxonomyPostRow, TaxonomyYearHead } from './taxonomy-year-list'

export function CategoryDetailScreen({ slug }: { slug: string }) {
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
    identity: `category:${locale}:${slug}`,
    read: () => readCategoryPosts(slug, locale),
    tables: ['posts', 'categories'],
  })
  const postsInCategory = snapshot?.posts ?? []
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

  const isEmpty = postsInCategory.length === 0
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
            {t('categoryMissing')}
          </AppText>
        ) : null}
        {!showMissing && !showRetry ? (
          <View style={styles.hero} onLayout={onTitleLayout}>
            <AppText variant="largeTitleSans">{name}</AppText>
            <AppText variant="meta">{subtitle}</AppText>
          </View>
        ) : null}
        {(status === 'error' || refreshFailed) && !isEmpty ? (
          <AppText variant="meta">{tl('syncFailed')}</AppText>
        ) : null}
        {featured ? (
          <TaxonomyPinned
            includeYear={!groupByYear}
            post={featured}
            onPress={() => openPost(router, featured)}
          />
        ) : null}
        {isEmpty && !showMissing && !showRetry ? (
          <AppText style={styles.center} variant="secondary">
            {t('categoryEmpty')}
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
                includeYear={!groupByYear}
                key={post.id}
                post={post}
                showCategorySource={false}
                onPress={() => openPost(router, post)}
              />
            ))}
          </View>
        ))}
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
  later: {
    marginTop: 18,
  },
  center: {
    marginTop: 32,
    textAlign: 'center',
  },
})
