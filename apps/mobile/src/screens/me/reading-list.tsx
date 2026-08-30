import { desc, eq } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, posts, readingHistory } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { ActivityEntry, ActivityUnavailable } from './activity-entry'
import { viewReadingItem } from './activity-entry-model'
import { readingHref } from './activity-href'
import {
  ActivityLink,
  openActivityHref,
  prepareActivityBody,
} from './activity-link'
import { type ReadingListItem, resolveReadingItems } from './reading-list-model'

export function ReadingListScreen() {
  const t = useTranslations('me')
  const tabs = useTranslations('tabs')
  const locale = useLocale()
  const palette = usePalette()
  const labels = { note: tabs('notes'), thinking: tabs('thinking') }
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
        rows.map((item) => (
          <ReadingRow item={item} key={readingRowKey(item)} labels={labels} />
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
  item,
  labels,
}: {
  item: ReadingListItem
  labels: { note: string; thinking: string }
}) {
  const t = useTranslations('me')
  const router = useRouter()
  const view = viewReadingItem(item, labels)
  const target = readingHref(item)

  if (view.kind === 'unavailable' || !target) {
    return <ActivityUnavailable label={t('unavailable')} />
  }

  const open = () =>
    openActivityHref(target, router, () => {
      if (target.webUrl) return prepareActivityBody(item, target.webUrl)
    })

  return (
    <ActivityLink target={target} onOpen={open}>
      <ActivityEntry
        accent={view.accent}
        createdAt={view.createdAt}
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
