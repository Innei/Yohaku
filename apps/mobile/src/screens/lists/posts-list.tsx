import { desc, eq, sql } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { db } from '@/db'
import { posts } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { ingestPostPage } from '@/sync/engine'
import { usePalette } from '@/theme/palette'

import { ListSearchToolbar } from '../search/search-chrome'
import { ListShell } from './list-shell'
import { PostContextLink } from './post-context-link'
import { hasMorePosts, nextPostListPage, pickFeaturedPost } from './post-list'

export function PostsListScreen() {
  const locale = useLocale()
  const t = useTranslations('list')
  const palette = usePalette()
  const query = useMemo(
    () =>
      db
        .select()
        .from(posts)
        .where(eq(posts.lang, locale))
        .orderBy(desc(sql`${posts.pinAt} is not null`), desc(posts.createdAt)),
    [locale],
  )
  const { data } = useLiveQuery(query, [locale])
  const postsInLocale = data ?? []
  const { featured, rest } = useMemo(() => pickFeaturedPost(data ?? []), [data])
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

  const onEndReached = useCallback(() => {
    const loaded = postsInLocale.length
    if (loadingMoreRef.current || !hasMorePosts(loaded, total)) return
    const requestedLocale = locale
    loadingMoreRef.current = true
    setLoadingMore(true)
    void ingestPostPage(nextPostListPage(loaded, fetchedPage), requestedLocale)
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
  }, [fetchedPage, locale, postsInLocale.length, total])

  return (
    <>
      <ListSearchToolbar scope="posts" />
      <ListShell
      eyebrow={t('blogKicker')}
      isEmpty={postsInLocale.length === 0}
      title={t('postsHeading')}
      titleVariant="largeTitleSans"
      onEndReached={onEndReached}
    >
      <View>
        {featured ? <PostContextLink featured post={featured} /> : null}
        <View
          style={[
            styles.countBar,
            { borderBottomColor: `${palette.neutral[10]}0f` },
            featured ? styles.countBarAfterFeatured : undefined,
          ]}
        >
          <AppText variant="meta">
            {t('postsTotal', { count: total ?? postsInLocale.length })}
          </AppText>
        </View>
        {rest.map((post) => (
          <PostContextLink key={post.id} post={post} />
        ))}
        {loadingMore ? (
          <ActivityIndicator color={palette.neutral[5]} style={styles.more} />
        ) : null}
      </View>
    </ListShell>
    </>
  )
}

const styles = StyleSheet.create({
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
