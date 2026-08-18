import { desc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText } from '@/components/ui'
import { db } from '@/db'
import { thinkings } from '@/db/schema'
import { useLocale, useTranslations } from '@/i18n'
import { formatThinkingClock, thinkingDayLabel } from '@/lib/datetime'
import { usePalette } from '@/theme/palette'

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
  const groups = useMemo(() => groupThinkingsByDay(data ?? []), [data])

  return (
    <ListShell
      isEmpty={!data?.length}
      title={tt('thinking')}
      titleVariant="largeTitleSans"
    >
      <View>
        {groups.map((group, groupIndex) => (
          <View
            key={group.key}
            style={groupIndex > 0 ? styles.laterDay : undefined}
          >
            <AppText style={styles.dayKicker} variant="eyebrow">
              {thinkingDayLabel(group.items[0].createdAt, locale)}
            </AppText>
            {group.items.map((item, itemIndex) => (
              <View
                key={item.id}
                style={[
                  itemIndex > 0 ? styles.followItem : undefined,
                  itemIndex > 0
                    ? { borderTopColor: palette.neutral[3] }
                    : undefined,
                ]}
              >
                {item.content ? (
                  <ThinkingBody
                    content={item.content}
                    enrichments={item.enrichments}
                  />
                ) : null}
                <AppText style={styles.clock} variant="meta">
                  {formatThinkingClock(item.createdAt, locale)}
                </AppText>
                <ThinkingActions item={item} />
              </View>
            ))}
          </View>
        ))}
      </View>
    </ListShell>
  )
}

const styles = StyleSheet.create({
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
