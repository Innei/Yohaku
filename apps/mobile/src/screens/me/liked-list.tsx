import { desc, eq } from 'drizzle-orm'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { likedRefs, notes, posts, thinkings } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import {
  flattenIndexList,
  INDEX_EMPTY_ID,
} from '@/screens/lists/flatten-index-list'
import { usePalette } from '@/theme/palette'

import { ActivityEntry, ActivityUnavailable } from './activity-entry'
import { viewLikedItem } from './activity-entry-model'
import { likedHref } from './activity-href'
import {
  ActivityLink,
  openActivityHref,
  prepareActivityBody,
} from './activity-link'
import { type LikedListItem, resolveLikedItems } from './liked-list-model'

const TITLE_ID = '__title'

export function LikedListScreen() {
  const t = useTranslations('me')
  const tabs = useTranslations('tabs')
  const locale = useLocale()
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()
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
  const rowsByKey = useMemo(() => {
    const map = new Map(rows.map((item) => [likedRowKey(item), item]))
    return map
  }, [rows])
  const listItems = useMemo(
    () => [
      { id: TITLE_ID, type: 'title', estimatedHeight: 48 },
      ...flattenIndexList({
        rowIds: rows.map(likedRowKey),
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
            return <AppText variant="largeTitleSans">{t('liked')}</AppText>
          }
          if (item.id === INDEX_EMPTY_ID) {
            return (
              <View style={styles.empty}>
                <AppText variant="entryTitleSans">{t('likedEmpty')}</AppText>
                <AppText variant="body">{t('likedEmptyHint')}</AppText>
              </View>
            )
          }
          const row = rowsByKey.get(item.id)
          if (!row) return null
          return <LikedRow item={row} labels={labels} />
        }}
      />
    </View>
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
