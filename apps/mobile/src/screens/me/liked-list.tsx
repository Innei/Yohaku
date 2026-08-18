import { desc, eq } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { likedRefs, notes, posts, thinkings } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { ActivityEntry, ActivityUnavailable } from './activity-entry'
import { viewLikedItem } from './activity-entry-model'
import { likedHref } from './activity-href'
import { ActivityLink, openActivityHref, primeActivityBody } from './activity-link'
import { type LikedListItem, resolveLikedItems } from './liked-list-model'

export function LikedListScreen() {
  const t = useTranslations('me')
  const tabs = useTranslations('tabs')
  const locale = useLocale()
  const palette = usePalette()
  const labels = { note: tabs('notes'), thinking: tabs('thinking') }
  const { snapshot: items } = useDatabaseSnapshot({
    identity: `liked:${locale}`,
    read: async () => {
      const [refs, postRows, noteRows, thinkingRows] = await Promise.all([
        db.select().from(likedRefs).orderBy(desc(likedRefs.likedAt)),
        db.select().from(posts).where(eq(posts.lang, locale)),
        db.select().from(notes).where(eq(notes.lang, locale)),
        db.select().from(thinkings),
      ])
      return resolveLikedItems(refs, postRows, noteRows, thinkingRows)
    },
    tables: ['liked_refs', 'notes', 'posts', 'thinkings'],
  })
  const rows = items ?? []

  return (
    <EdgeEffectScrollView
      contentContainerStyle={styles.content}
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
    >
      <AppText variant="largeTitleSans">{t('liked')}</AppText>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="entryTitleSans">{t('likedEmpty')}</AppText>
          <AppText variant="body">{t('likedEmptyHint')}</AppText>
        </View>
      ) : (
        rows.map((item) => (
          <LikedRow item={item} key={likedRowKey(item)} labels={labels} />
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

function LikedRow({
  item,
  labels,
}: {
  item: LikedListItem
  labels: { note: string; thinking: string }
}) {
  const t = useTranslations('me')
  const router = useRouter()
  const view = viewLikedItem(item, labels)
  const target = likedHref(item)

  if (view.kind === 'unavailable' || !target) {
    return <ActivityUnavailable label={t('unavailable')} />
  }

  const open = () =>
    openActivityHref(target, router, () => {
      if (target.webUrl) primeActivityBody(item, target.webUrl)
    })

  return (
    <ActivityLink target={target} onOpen={open}>
      <ActivityEntry
        accent={view.accent}
        createdAt={view.createdAt}
        excerpt={view.excerpt}
        title={view.title}
        onAccessibilityTap={open}
      />
    </ActivityLink>
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
})
