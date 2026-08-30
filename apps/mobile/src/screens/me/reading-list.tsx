import { desc, eq } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { notes, posts, readingHistory } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import {
  flattenIndexList,
  INDEX_EMPTY_ID,
} from '@/screens/lists/flatten-index-list'
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

const TITLE_ID = '__title'

export function ReadingListScreen() {
  const t = useTranslations('me')
  const tabs = useTranslations('tabs')
  const locale = useLocale()
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()
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
  const rowsByKey = useMemo(() => {
    const map = new Map(rows.map((item) => [readingRowKey(item), item]))
    return map
  }, [rows])
  const listItems = useMemo(
    () => [
      { id: TITLE_ID, type: 'title', estimatedHeight: 48 },
      ...flattenIndexList({
        rowIds: rows.map(readingRowKey),
        showEmpty: rows.length === 0,
        showStatus: false,
      }),
    ],
    [rows],
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <YohakuList
        contentInsetBottom={tabBarInset}
        items={listItems}
        style={styles.screen}
        renderItem={(item) => {
          if (item.id === TITLE_ID) {
            return <AppText variant="largeTitleSans">{t('reading')}</AppText>
          }
          if (item.id === INDEX_EMPTY_ID) {
            return (
              <View style={styles.empty}>
                <AppText variant="entryTitleSans">{t('readingEmpty')}</AppText>
                <AppText variant="body">{t('readingEmptyHint')}</AppText>
              </View>
            )
          }
          const row = rowsByKey.get(item.id)
          if (!row) return null
          return <ReadingRow item={row} labels={labels} />
        }}
      />
    </View>
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
  empty: {
    marginTop: 48,
    gap: 6,
    alignItems: 'center',
  },
})
