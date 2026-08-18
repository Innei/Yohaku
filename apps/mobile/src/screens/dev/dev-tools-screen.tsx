import { Link } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { API_PRESETS, apiBaseUrl, setApiBaseUrl } from '@/api/base-url'
import { AppText, Paper, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { socketTrace } from '@/socket/trace'
import {
  useGatewayDebug,
  useSocketTraceEntries,
} from '@/socket/use-gateway-debug'
import { resetAndResync } from '@/sync/engine'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

export function DevToolsScreen() {
  const t = useTranslations('dev')
  const palette = usePalette()
  const [baseUrl, setBaseUrl] = useState(() => apiBaseUrl())
  const [busy, setBusy] = useState(false)

  const active =
    API_PRESETS.find((preset) => preset.url === baseUrl)?.id ?? null
  const apiLabel = busy ? t('apiSyncing') : active ? t(active) : t('apiCustom')

  const select = async (url: string) => {
    if (busy || url === baseUrl) return
    setApiBaseUrl(url)
    setBaseUrl(url)
    setBusy(true)
    try {
      await resetAndResync()
    } finally {
      setBusy(false)
    }
  }

  return (
    <ScrollView
      style={[styles.sheet, { backgroundColor: palette.surface.desk }]}
      contentContainerStyle={styles.content}
    >
      <AppText style={styles.title} variant="entryTitle">
        {t('title')}
      </AppText>
      <Paper style={styles.card}>
        <View style={styles.cardRow}>
          <AppText variant="secondary">{t('api')}</AppText>
          <AppText color={palette.neutral[6]} variant="meta">
            {apiLabel}
          </AppText>
        </View>
        {API_PRESETS.map((preset) => (
          <View key={preset.id}>
            <View
              style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
            />
            <SinkPressable
              style={styles.cardRow}
              onPress={() => void select(preset.url)}
            >
              <View style={styles.preset}>
                <AppText variant="body">{t(preset.id)}</AppText>
                <AppText numberOfLines={1} variant="meta">
                  {preset.url}
                </AppText>
              </View>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      preset.url === baseUrl ? palette.accent : 'transparent',
                    borderColor:
                      preset.url === baseUrl
                        ? palette.accent
                        : palette.neutral[5],
                  },
                ]}
              />
            </SinkPressable>
          </View>
        ))}
      </Paper>
      <GatewayTraceCard />
      <Link asChild href="/dev-demos">
        <SinkPressable>
          <Paper style={styles.entry}>
            <AppText variant="entryTitle">{t('componentGallery')}</AppText>
            <AppText variant="secondary">{t('componentGalleryHint')}</AppText>
          </Paper>
        </SinkPressable>
      </Link>
    </ScrollView>
  )
}

function GatewayTraceCard() {
  const t = useTranslations('dev')
  const palette = usePalette()
  const debug = useGatewayDebug()
  const events = useSocketTraceEntries()
  const newestFirst = events.slice().reverse()

  return (
    <Paper style={styles.card}>
      <View style={styles.cardRow}>
        <AppText variant="secondary">{t('websocket')}</AppText>
        <AppText color={palette.neutral[6]} variant="meta">
          {debug.state}
        </AppText>
      </View>
      <View style={[styles.hairline, { backgroundColor: palette.neutral[4] }]} />
      <View style={styles.cardRow}>
        <AppText variant="secondary">{t('wsSession')}</AppText>
        <AppText
          color={palette.neutral[6]}
          numberOfLines={1}
          style={styles.mono}
          variant="meta"
        >
          {debug.sid ?? '—'}
        </AppText>
      </View>
      {debug.url ? (
        <>
          <View
            style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
          />
          <View style={styles.urlRow}>
            <AppText
              color={palette.neutral[6]}
              numberOfLines={2}
              style={styles.mono}
              variant="meta"
            >
              {debug.url}
            </AppText>
          </View>
        </>
      ) : null}
      <View style={[styles.hairline, { backgroundColor: palette.neutral[4] }]} />
      {newestFirst.length === 0 ? (
        <View style={styles.cardRow}>
          <AppText color={palette.neutral[6]} variant="meta">
            {t('wsEmpty')}
          </AppText>
        </View>
      ) : (
        newestFirst.map((entry, index) => (
          <View key={`${entry.at}-${index}`} style={styles.event}>
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
            {entry.payload !== undefined ? (
              <AppText
                color={palette.neutral[6]}
                numberOfLines={3}
                style={styles.mono}
                variant="meta"
              >
                {socketTrace.summarize(entry.payload)}
              </AppText>
            ) : null}
          </View>
        ))
      )}
    </Paper>
  )
}

function directionMark(dir: 'in' | 'out' | 'state') {
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
  sheet: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    paddingHorizontal: 2,
  },
  card: {
    paddingHorizontal: 18,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  urlRow: {
    paddingVertical: 12,
  },
  preset: {
    flex: 1,
    gap: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
  },
  entry: {
    padding: 18,
    gap: 4,
  },
  event: {
    paddingVertical: 10,
    gap: 4,
  },
  eventHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventName: {
    flex: 1,
  },
  mono: {
    ...fonts.mono,
  },
})
