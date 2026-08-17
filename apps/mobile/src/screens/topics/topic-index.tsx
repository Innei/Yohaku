import { desc, eq } from 'drizzle-orm'
import { Stack, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'

import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { AppText, NativePressable } from '@/components/ui'
import { db } from '@/db'
import { notes, topics } from '@/db/schema'
import { useDatabaseSnapshot } from '@/db/use-database-snapshot'
import { useLocale, useTranslations } from '@/i18n'
import { useCollapsingTitle } from '@/screens/details/use-collapsing-title'
import { syncAll } from '@/sync/engine'
import { useSyncStatus } from '@/sync/status'
import { usePalette } from '@/theme/palette'

import { TopicNameRow } from './topic-chip'
import { TopicBackControl } from './topic-chrome'

export function TopicIndexScreen() {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('topic')
  const tl = useTranslations('list')
  const palette = usePalette()
  const status = useSyncStatus()
  const { snapshot } = useDatabaseSnapshot({
    identity: `topic-index:${locale}`,
    read: async () => {
      const [items, noteRows] = await Promise.all([
        db.select().from(topics).orderBy(desc(topics.createdAt)),
        db
          .select({ topicId: notes.topicId })
          .from(notes)
          .where(eq(notes.lang, locale)),
      ])
      return { items, noteRows }
    },
    tables: ['notes', 'topics'],
  })
  const items = snapshot?.items ?? []
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const row of snapshot?.noteRows ?? []) {
      if (!row.topicId) continue
      map.set(row.topicId, (map.get(row.topicId) ?? 0) + 1)
    }
    return map
  }, [snapshot])
  const { headerTitleProgress, headerOptions, onScroll } = useCollapsingTitle(
    t('indexTitle'),
    '',
    undefined,
    undefined,
    {
      alwaysVisible: true,
      titleFontSize: 18,
      titleFontWeight: 'bold',
    },
  )
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await syncAll({ force: true })
    } finally {
      setRefreshing(false)
    }
  }, [])
  const isEmpty = items.length === 0

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Stack.Screen options={headerOptions} />
      <TopicBackControl />
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
        {status === 'error' && !isEmpty ? (
          <AppText variant="meta">{tl('syncFailed')}</AppText>
        ) : null}
        {isEmpty ? (
          <AppText style={styles.empty} variant="secondary">
            {status === 'syncing' ? tl('syncing') : t('empty')}
          </AppText>
        ) : (
          items.map((topic, index) => {
            const count = counts.get(topic.id) ?? 0
            return (
              <NativePressable
                key={topic.id}
                style={[
                  styles.item,
                  index > 0
                    ? {
                        borderTopColor: palette.neutral[3],
                        borderTopWidth: StyleSheet.hairlineWidth,
                      }
                    : null,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/series/[slug]',
                    params: { slug: topic.slug, topicId: topic.id },
                  })
                }
              >
                <TopicNameRow size="md" topic={topic} />
                {topic.introduce ? (
                  <AppText color={palette.neutral[7]} variant="secondary">
                    {topic.introduce}
                  </AppText>
                ) : null}
                {count > 0 ? (
                  <AppText variant="meta">{t('noteCount', { count })}</AppText>
                ) : null}
              </NativePressable>
            )
          })
        )}
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
  item: {
    gap: 6,
    paddingVertical: 16,
  },
  empty: {
    marginTop: 48,
    textAlign: 'center',
  },
})
