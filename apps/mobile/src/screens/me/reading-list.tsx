import { desc, eq } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { StyleSheet, View } from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import { notes, posts, readingHistory } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { siteHref } from '@/lib/site-url'
import { usePalette } from '@/theme/palette'

import { type ReadingListItem, resolveReadingItems } from './reading-list-model'

export function ReadingListScreen() {
  const t = useTranslations('me')
  const locale = useLocale()
  const palette = usePalette()
  const { snapshot: items } = useDatabaseSnapshot({
    identity: `reading:${locale}`,
    read: async () => {
      const [history, postRows, noteRows] = await Promise.all([
        db.select().from(readingHistory).orderBy(desc(readingHistory.openedAt)),
        db.select().from(posts).where(eq(posts.lang, locale)),
        db.select().from(notes).where(eq(notes.lang, locale)),
      ])
      return resolveReadingItems(history, postRows, noteRows)
    },
    tables: ['notes', 'posts', 'reading_history'],
  })
  const rows = items ?? []

  return (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
    >
      <AppText variant="largeTitleSans">{t('reading')}</AppText>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="entryTitleSans">{t('readingEmpty')}</AppText>
          <AppText variant="body">{t('readingEmptyHint')}</AppText>
        </View>
      ) : (
        rows.map((item, index) => (
          <ReadingRow
            first={index === 0}
            item={item}
            key={readingRowKey(item)}
          />
        ))
      )}
    </EdgeEffectScrollView>
  )
}

function readingRowKey(item: ReadingListItem): string {
  if (item.kind === 'post') return `post:${item.post.id}`
  if (item.kind === 'note') return `note:${item.note.id}`
  return `gone:${item.refId}`
}

function ReadingRow({
  first,
  item,
}: {
  first: boolean
  item: ReadingListItem
}) {
  const t = useTranslations('me')
  const palette = usePalette()
  const router = useRouter()
  const rule = first
    ? undefined
    : [styles.rowRule, { borderTopColor: palette.neutral[3] }]

  if (item.kind === 'unavailable') {
    return (
      <View style={[styles.row, rule]}>
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
        params: {
          category: item.post.categorySlug,
          postId: item.post.id,
          slug: item.post.slug,
        },
      })
      return
    }
    const webUrl = siteHref(`/notes/${item.note.nid}`)
    if (item.note.hasPassword || item.note.contentFormat === 'markdown') {
      void WebBrowser.openBrowserAsync(webUrl)
      return
    }
    router.push({
      pathname: '/notes/[nid]',
      params: { nid: String(item.note.nid) },
    })
  }

  return (
    <NativePressable style={[styles.row, rule]} onPress={onPress}>
      <AppText numberOfLines={2} variant="entryTitleSans">
        {item.kind === 'post' ? item.post.title : item.note.title}
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
