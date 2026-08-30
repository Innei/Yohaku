import { count, desc, eq, sql } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatRelativeTime } from '@/lib/datetime'
import { openPost } from '@/lib/open-article'
import { ingestPostPage, syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { useListBodyIngest } from '@/sync/use-list-body-ingest'
import { usePalette } from '@/theme/palette'

import { ListSearchToolbar } from '../search/search-chrome'
import {
  articleIdsFromVisible,
  flattenPostsList,
  POST_LIST_CHROME_ID,
  POST_LIST_COUNT_ID,
  POST_LIST_FOOTER_ID,
} from './flatten-posts-list'
import { ListShell } from './list-shell'
import { PostContextLink } from './post-context-link'
import {
  hasMorePosts,
  nextPostListLimit,
  nextPostListPage,
  partitionTags,
  pickFeaturedPost,
  postListPageSize,
} from './post-list'

export function PostsListScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('list')
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()
  const status = useSyncStatus()
  const [window, setWindow] = useState({
    limit: postListPageSize,
    locale,
  })
  const visibleLimit =
    window.locale === locale ? window.limit : postListPageSize
  const query = useMemo(
    () =>
      db
        .select({
          bodyVersion: posts.bodyVersion,
          categoryName: posts.categoryName,
          categorySlug: posts.categorySlug,
          contentFormat: posts.contentFormat,
          createdAt: posts.createdAt,
          id: posts.id,
          likeCount: posts.likeCount,
          modifiedAt: posts.modifiedAt,
          pinAt: posts.pinAt,
          readCount: posts.readCount,
          slug: posts.slug,
          tags: posts.tags,
          title: posts.title,
        })
        .from(posts)
        .where(eq(posts.lang, locale))
        .orderBy(desc(sql`${posts.pinAt} is not null`), desc(posts.createdAt))
        .limit(visibleLimit),
    [locale, visibleLimit],
  )
  const countQuery = useMemo(
    () =>
      db.select({ value: count() }).from(posts).where(eq(posts.lang, locale)),
    [locale],
  )
  const { data } = useLiveQuery(query, [locale, visibleLimit])
  const { data: countRows } = useLiveQuery(countQuery, [locale])
  const postsInLocale = useMemo(() => data ?? [], [data])
  const cachedCount = countRows?.[0]?.value ?? postsInLocale.length
  const { featured, rest } = useMemo(
    () => pickFeaturedPost(postsInLocale),
    [postsInLocale],
  )
  const [paging, setPaging] = useState({
    fetchedPage: 0,
    locale,
    total: null as number | null,
  })
  const total = paging.locale === locale ? paging.total : null
  const fetchedPage = paging.locale === locale ? paging.fetchedPage : 0
  const [loadingMore, setLoadingMore] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [visibleIds, setVisibleIds] = useState<string[] | undefined>()
  const loadingMoreRef = useRef(false)
  const localeRef = useRef(locale)
  localeRef.current = locale

  useListBodyIngest(
    postsInLocale.map((post) => ({
      id: post.id,
      kind: 'post' as const,
      bodyVersion: post.bodyVersion,
      contentFormat: post.contentFormat,
      createdAt: post.createdAt,
      modifiedAt: post.modifiedAt,
    })),
    { visibleIds },
  )

  const postsById = useMemo(
    () => new Map(postsInLocale.map((post) => [post.id, post])),
    [postsInLocale],
  )
  const listItems = useMemo(() => {
    const flattened = flattenPostsList({
      featuredId: featured?.id ?? null,
      loadingMore,
      restIds: rest.map((post) => post.id),
    })
    return flattened.map((item) => {
      if (item.type !== 'post') return item
      const post = postsById.get(item.id)
      if (!post) return item
      const { hiddenCount, visible } = partitionTags(post.tags)
      return {
        ...item,
        categoryName: post.categoryName ?? '',
        categorySlug: post.categorySlug ?? '',
        date: formatRelativeTime(post.createdAt, locale),
        hiddenTagCount: hiddenCount,
        tags: visible,
        title: post.title,
      }
    })
  }, [featured?.id, loadingMore, locale, postsById, rest])

  const onEndReached = useCallback(() => {
    if (loadingMoreRef.current) return
    if (postsInLocale.length < cachedCount) {
      setWindow({
        limit: nextPostListLimit(visibleLimit, cachedCount),
        locale,
      })
      return
    }
    if (!hasMorePosts(cachedCount, total)) return
    const requestedLocale = locale
    loadingMoreRef.current = true
    setLoadingMore(true)
    void ingestPostPage(
      nextPostListPage(cachedCount, fetchedPage),
      requestedLocale,
    )
      .then((paged) => {
        if (localeRef.current !== requestedLocale) return
        setPaging({
          fetchedPage: paged.pagination.page,
          locale: requestedLocale,
          total: paged.pagination.total,
        })
        setWindow((current) => ({
          limit:
            (current.locale === requestedLocale
              ? current.limit
              : postListPageSize) + postListPageSize,
          locale: requestedLocale,
        }))
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false
        setLoadingMore(false)
      })
  }, [
    cachedCount,
    fetchedPage,
    locale,
    postsInLocale.length,
    total,
    visibleLimit,
  ])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])

  if (postsInLocale.length === 0) {
    return (
      <>
        <ListSearchToolbar scope="posts" />
        <ListShell
          isEmpty
          eyebrow={t('blogKicker')}
          title={t('postsHeading')}
          titleVariant="largeTitleSans"
        />
      </>
    )
  }

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <ListSearchToolbar scope="posts" />
      <YohakuList
        contentInsetBottom={tabBarInset}
        items={listItems}
        refreshing={refreshing}
        style={styles.screen}
        renderItem={(item) => {
          if (item.id === POST_LIST_CHROME_ID) {
            return (
              <View style={styles.header}>
                <AppText style={styles.eyebrow} variant="eyebrow">
                  {t('blogKicker')}
                </AppText>
                <AppText variant="largeTitleSans">{t('postsHeading')}</AppText>
                {status === 'error' ? (
                  <AppText variant="meta">{t('syncFailed')}</AppText>
                ) : null}
              </View>
            )
          }
          if (item.id === POST_LIST_COUNT_ID) {
            return (
              <View
                style={[
                  styles.countBar,
                  { borderBottomColor: `${palette.neutral[10]}0f` },
                  featured ? styles.countBarAfterFeatured : undefined,
                ]}
              >
                <AppText variant="meta">
                  {t('postsTotal', { count: total ?? cachedCount })}
                </AppText>
              </View>
            )
          }
          if (item.id === POST_LIST_FOOTER_ID) {
            return (
              <ActivityIndicator
                color={palette.neutral[5]}
                style={styles.more}
              />
            )
          }
          if (item.type === 'post') return null
          const post = postsById.get(item.id)
          return post ? (
            <PostContextLink featured={item.type === 'featured'} post={post} />
          ) : null
        }}
        onEndReached={onEndReached}
        onRefresh={onRefresh}
        onVisibleItems={(items) => setVisibleIds(articleIdsFromVisible(items))}
        onItemPress={({ id }) => {
          const post = postsById.get(id)
          if (post) openPost(router, post)
        }}
        onLinkPress={(kind, value) => {
          if (kind === 'category') {
            router.push({
              pathname: '/categories/[slug]',
              params: { slug: value },
            })
          } else if (kind === 'tag') {
            router.push({
              pathname: '/posts/tag/[name]',
              params: { name: value },
            })
          }
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    gap: 6,
    paddingBottom: 8,
  },
  eyebrow: {
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  countBar: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  countBarAfterFeatured: {
    marginTop: 16,
  },
  more: {
    marginTop: 16,
  },
})
