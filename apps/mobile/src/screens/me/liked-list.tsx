import { desc, eq } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import { likedRefs, notes, posts, thinkings } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { siteHref } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { type LikedListItem, resolveLikedItems } from './liked-list-model'

const likedQuery = db.select().from(likedRefs).orderBy(desc(likedRefs.likedAt))
const thinkingQuery = db.select().from(thinkings)

export function LikedListScreen() {
  const t = useTranslations('me')
  const locale = useLocale()
  const palette = usePalette()
  const { data: refs } = useLiveQuery(likedQuery)
  const postsQuery = useMemo(
    () => db.select().from(posts).where(eq(posts.lang, locale)),
    [locale],
  )
  const notesQuery = useMemo(
    () => db.select().from(notes).where(eq(notes.lang, locale)),
    [locale],
  )
  const { data: postRows } = useLiveQuery(postsQuery, [locale])
  const { data: noteRows } = useLiveQuery(notesQuery, [locale])
  const { data: thinkingRows } = useLiveQuery(thinkingQuery)
  const items = useMemo(
    () =>
      resolveLikedItems(
        refs ?? [],
        postRows ?? [],
        noteRows ?? [],
        thinkingRows ?? [],
      ),
    [refs, postRows, noteRows, thinkingRows],
  )

  return (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
    >
      <AppText variant="largeTitleSans">{t('liked')}</AppText>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="entryTitleSans">{t('likedEmpty')}</AppText>
          <AppText variant="body">{t('likedEmptyHint')}</AppText>
        </View>
      ) : (
        items.map((item, index) => (
          <LikedRow first={index === 0} item={item} key={likedRowKey(item)} />
        ))
      )}
    </EdgeEffectScrollView>
  )
}

function likedRowKey(item: LikedListItem): string {
  if (item.kind === 'post') return `post:${item.post.id}`
  if (item.kind === 'note') return `note:${item.note.id}`
  if (item.kind === 'thinking') return `thinking:${item.thinking.id}`
  return `gone:${item.refId}`
}

function LikedRow({ first, item }: { first: boolean; item: LikedListItem }) {
  const t = useTranslations('me')
  const palette = usePalette()
  const router = useRouter()

  if (item.kind === 'unavailable') {
    return (
      <View
        style={[
          styles.row,
          first ? undefined : styles.rowRule,
          first ? undefined : { borderTopColor: palette.neutral[3] },
        ]}
      >
        <AppText color={palette.neutral[6]} variant="body">
          {t('unavailable')}
        </AppText>
      </View>
    )
  }

  const onPress = () => {
    if (item.kind === 'post') {
      if (!item.post.categorySlug) return
      const webUrl = siteHref(
        `/posts/${item.post.categorySlug}/${item.post.slug}`,
      )
      if (item.post.contentFormat === 'markdown') {
        void WebBrowser.openBrowserAsync(webUrl)
        return
      }
      router.push({
        pathname: '/posts/[category]/[slug]',
        params: { category: item.post.categorySlug, slug: item.post.slug },
      })
      return
    }
    if (item.kind === 'note') {
      const webUrl = siteHref(`/notes/${item.note.nid}`)
      if (item.note.hasPassword || item.note.contentFormat === 'markdown') {
        void WebBrowser.openBrowserAsync(webUrl)
        return
      }
      router.push({
        pathname: '/notes/[nid]',
        params: { nid: String(item.note.nid) },
      })
      return
    }
    router.push({
      pathname: '/comments/[id]',
      params: { id: item.thinking.id },
    })
  }

  const title =
    item.kind === 'post'
      ? item.post.title
      : item.kind === 'note'
        ? item.note.title
        : item.thinking.content

  return (
    <NativePressable
      style={[
        styles.row,
        first ? undefined : styles.rowRule,
        first ? undefined : { borderTopColor: palette.neutral[3] },
      ]}
      onPress={onPress}
    >
      <AppText numberOfLines={2} variant="entryTitleSans">
        {title}
      </AppText>
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  empty: {
    marginTop: 48,
    gap: 6,
    alignItems: 'center',
  },
  row: {
    paddingVertical: 14,
  },
  rowRule: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
})
