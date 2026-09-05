import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'

import { YohakuList } from '@/components/list/yohaku-list'
import type { GroupedListRow } from '@/components/ui'
import { AppText, GroupedList } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { socketTrace, type SocketTraceEntry } from '@/socket/trace'
import {
  useGatewayDebug,
  useSocketTraceEntries,
} from '@/socket/use-gateway-debug'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

const TITLE_ID = '__title'
const INFO_ID = '__info'
const EMPTY_ID = '__empty'

export function WebsocketScreen() {
  const t = useTranslations('dev')
  const palette = usePalette()
  const debug = useGatewayDebug()
  const events = useSocketTraceEntries()
  const newestFirst = useMemo(() => events.slice().reverse(), [events])
  const eventsById = useMemo(() => {
    const map = new Map<string, SocketTraceEntry>()
    newestFirst.forEach((entry, index) => {
      map.set(eventItemId(entry, index), entry)
    })
    return map
  }, [newestFirst])

  const infoRows = useMemo((): GroupedListRow[] => {
    const rows: GroupedListRow[] = [
      {
        id: 'state',
        label: t('websocket'),
        value: debug.state,
      },
      {
        id: 'session',
        label: t('wsSession'),
        value: debug.sid ?? '—',
      },
    ]
    if (debug.url) {
      rows.push({
        id: 'url',
        label: debug.url,
      })
    }
    return rows
  }, [debug.sid, debug.state, debug.url, t])

  const items = useMemo(() => {
    const rows = [
      { id: TITLE_ID, type: 'title', estimatedHeight: 40 },
      {
        id: INFO_ID,
        type: 'info',
        estimatedHeight: infoRows.length * 46 + 8,
      },
    ]
    if (newestFirst.length === 0) {
      rows.push({ id: EMPTY_ID, type: 'empty', estimatedHeight: 52 })
      return rows
    }
    newestFirst.forEach((entry, index) => {
      rows.push({
        id: eventItemId(entry, index),
        type: 'event',
        estimatedHeight: entry.payload === undefined ? 44 : 76,
      })
    })
    return rows
  }, [infoRows.length, newestFirst])

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <YohakuList
        contentInsetBottom={24}
        contentInsetTop={52}
        items={items}
        renderItem={(item) => {
          if (item.id === TITLE_ID) {
            return <AppText variant="entryTitle">{t('websocket')}</AppText>
          }
          if (item.id === INFO_ID) {
            return <GroupedList rows={infoRows} style={styles.grouped} />
          }
          if (item.id === EMPTY_ID) {
            return (
              <AppText color={palette.neutral[6]} variant="secondary">
                {t('wsEmpty')}
              </AppText>
            )
          }
          const entry = eventsById.get(item.id)
          if (!entry) return null
          return <EventCell entry={entry} />
        }}
        style={styles.screen}
        topEdgeEffectHidden
      />
    </View>
  )
}

function EventCell({ entry }: { entry: SocketTraceEntry }) {
  const palette = usePalette()
  const summary =
    entry.payload === undefined ? '' : socketTrace.summarize(entry.payload)
  return (
    <View style={styles.event}>
      <View style={styles.eventHead}>
        <AppText color={palette.neutral[6]} variant="meta">
          {formatTraceClock(entry.at)}
        </AppText>
        <AppText color={palette.accent} variant="meta">
          {directionMark(entry.dir)}
        </AppText>
        <AppText style={styles.eventName} variant="meta">
          {entry.event}
        </AppText>
      </View>
      {summary ? (
        <AppText
          color={palette.neutral[6]}
          numberOfLines={3}
          style={styles.mono}
          variant="meta"
        >
          {summary}
        </AppText>
      ) : null}
    </View>
  )
}

function eventItemId(entry: SocketTraceEntry, index: number) {
  return `${entry.at}-${index}-${entry.event}`
}

function directionMark(dir: SocketTraceEntry['dir']) {
  if (dir === 'in') return '↓'
  if (dir === 'out') return '↑'
  return '●'
}

function formatTraceClock(at: number) {
  const date = new Date(at)
  const pad = (value: number, width = 2) => String(value).padStart(width, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`
}

const styles = StyleSheet.create({
  event: {
    gap: 4,
    paddingVertical: 10,
  },
  eventHead: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  eventName: {
    flex: 1,
  },
  grouped: {
    marginHorizontal: -20,
  },
  mono: {
    ...fonts.mono,
  },
  screen: {
    flex: 1,
  },
})
