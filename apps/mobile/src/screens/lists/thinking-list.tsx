import { desc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
import { AppText } from '@/components/ui'
import { db } from '@/db'
import { thinkings } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatThinkingClock, thinkingDayLabel } from '@/lib/datetime'
import { syncAll } from '@/sync/engine'
import { usePalette } from '@/theme/palette'

import { ListSearchToolbar } from '../search/search-chrome'
import {
  flattenThinkingList,
  THINKING_CHROME_ID,
  thinkingDayItemId,
} from './flatten-thinking-list'
import { ListShell } from './list-shell'
import { ThinkingActions } from './thinking-actions'
import { ThinkingBody } from './thinking-body'
import { groupThinkingsByDay } from './thinking-timeline'

const query = db.select().from(thinkings).orderBy(desc(thinkings.createdAt))

export function ThinkingListScreen() {
  const { data } = useLiveQuery(query)
  const locale = useLocale()
  const tt = useTranslations('tabs')
  const palette = usePalette()
  const tabBarInset = usePaperTabBarInset()
  const [refreshing, setRefreshing] = useState(false)
  const groups = useMemo(() => groupThinkingsByDay(data ?? []), [data])
  const itemsById = useMemo(() => {
    const map = new Map((data ?? []).map((item) => [item.id, item]))
    return map
  }, [data])
  const listItems = useMemo(() => flattenThinkingList({ groups }), [groups])
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])
  const isEmpty = !data?.length

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <ListSearchToolbar scope="thinking" />
      {isEmpty ? (
        <ListShell isEmpty title={tt('thinking')} titleVariant="largeTitleSans" />
      ) : (
        <YohakuList
          contentInsetBottom={tabBarInset}
          items={listItems}
          refreshing={refreshing}
          style={styles.screen}
          renderItem={(item) => {
            if (item.id === THINKING_CHROME_ID) {
              return (
                <View style={styles.header}>
                  <AppText variant="largeTitleSans">{tt('thinking')}</AppText>
                </View>
              )
            }
            if (item.type === 'day') {
              const group = groups.find(
                (entry) => thinkingDayItemId(entry.key) === item.id,
              )
              if (!group) return null
              return (
                <AppText
                  style={[
                    styles.dayKicker,
                    group !== groups[0] ? styles.laterDay : undefined,
                  ]}
                  variant="eyebrow"
                >
                  {thinkingDayLabel(group.items[0].createdAt, locale)}
                </AppText>
              )
            }
            const thinking = itemsById.get(item.id)
            if (!thinking) return null
            const group = groups.find((entry) =>
              entry.items.some((row) => row.id === thinking.id),
            )
            const follow = group ? group.items[0]?.id !== thinking.id : false
            return (
              <View
                style={[
                  follow ? styles.followItem : undefined,
                  follow ? { borderTopColor: palette.neutral[3] } : undefined,
                ]}
              >
                {thinking.content ? (
                  <ThinkingBody
                    content={thinking.content}
                    enrichments={thinking.enrichments}
                  />
                ) : null}
                <AppText style={styles.clock} variant="meta">
                  {formatThinkingClock(thinking.createdAt, locale)}
                </AppText>
                <ThinkingActions item={thinking} />
              </View>
            )
          }}
          onRefresh={onRefresh}
        />
      )}
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
  laterDay: {
    marginTop: 28,
  },
  dayKicker: {
    marginBottom: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  followItem: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clock: {
    marginTop: 8,
  },
})
