import { Link, useLocalSearchParams } from 'expo-router'
import * as Updates from 'expo-updates'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'

import { API_PRESETS, apiBaseUrl, setApiBaseUrl } from '@/api/base-url'
import { AppText, Paper, SinkPressable } from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { useTranslations } from '@/i18n'
import { useGatewayDebug } from '@/socket/use-gateway-debug'
import { resetAndResync } from '@/sync/engine'
import { usePalette } from '@/theme/palette'

export function DevToolsScreen() {
  const t = useTranslations('dev')
  const palette = usePalette()
  const debug = useGatewayDebug()
  const params = useLocalSearchParams<{ toast?: string | string[] }>()
  const [baseUrl, setBaseUrl] = useState(() => apiBaseUrl())
  const [busy, setBusy] = useState(false)
  const demoToast = Array.isArray(params.toast) ? params.toast[0] : params.toast
  const demoToastFired = useRef(false)

  useEffect(() => {
    if (demoToastFired.current) return
    if (demoToast !== '1' && demoToast !== 'stack') return
    demoToastFired.current = true
    if (demoToast === 'stack') {
      showToast(t('toastSample'))
      showToast(t('toastSampleTwo'))
      showToast(t('toastSampleThree'))
      return
    }
    showToast(t('toastSample'))
  }, [demoToast, t])

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
      <Paper style={styles.card}>
        <SinkPressable
          accessibilityLabel={t('showToast')}
          style={styles.cardRow}
          onPress={() => showToast(t('toastSample'))}
        >
          <AppText variant="body">{t('showToast')}</AppText>
        </SinkPressable>
        <View
          style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
        />
        <SinkPressable
          accessibilityLabel={t('showToastStack')}
          style={styles.cardRow}
          onPress={() => {
            showToast(t('toastSample'))
            showToast(t('toastSampleTwo'))
            showToast(t('toastSampleThree'))
          }}
        >
          <AppText variant="body">{t('showToastStack')}</AppText>
        </SinkPressable>
      </Paper>
      <OtaCard />
      <Link asChild href="/dev/websocket">
        <SinkPressable>
          <Paper style={styles.entry}>
            <View style={styles.entryHead}>
              <AppText variant="entryTitle">{t('websocket')}</AppText>
              <AppText color={palette.neutral[6]} variant="meta">
                {debug.state}
              </AppText>
            </View>
            <AppText variant="secondary">{t('websocketHint')}</AppText>
          </Paper>
        </SinkPressable>
      </Link>
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

function OtaCard() {
  const t = useTranslations('dev')
  const palette = usePalette()
  const [status, setStatus] = useState<
    'idle' | 'checking' | 'ready' | 'unavailable' | 'failed'
  >('idle')
  const [busy, setBusy] = useState(false)

  const source = Updates.isEmbeddedLaunch
    ? t('otaSourceEmbedded')
    : t('otaSourceUpdate')
  const statusLabel = {
    idle: t('otaIdle'),
    checking: t('otaChecking'),
    ready: t('otaReady'),
    unavailable: t('otaUnavailable'),
    failed: t('otaFailed'),
  }[status]

  const check = async () => {
    if (busy) return
    setBusy(true)
    setStatus('checking')
    try {
      const result = await Updates.checkForUpdateAsync()
      setStatus(result.isAvailable ? 'ready' : 'unavailable')
    } catch {
      setStatus('failed')
    } finally {
      setBusy(false)
    }
  }

  const apply = async () => {
    if (busy) return
    setBusy(true)
    try {
      const fetched = await Updates.fetchUpdateAsync()
      if (fetched.isNew) {
        await Updates.reloadAsync()
        return
      }
      setStatus('unavailable')
    } catch {
      setStatus('failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Paper style={styles.card}>
      <View style={styles.cardRow}>
        <AppText variant="secondary">{t('ota')}</AppText>
        <AppText color={palette.neutral[6]} variant="meta">
          {source}
        </AppText>
      </View>
      <View
        style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
      />
      <View style={styles.cardRow}>
        <AppText color={palette.neutral[6]} variant="meta">
          {statusLabel}
        </AppText>
      </View>
      <View
        style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
      />
      <SinkPressable
        disabled={busy}
        style={styles.cardRow}
        onPress={() => void check()}
      >
        <AppText variant="body">{t('otaCheck')}</AppText>
      </SinkPressable>
      <View
        style={[styles.hairline, { backgroundColor: palette.neutral[4] }]}
      />
      <SinkPressable
        disabled={busy}
        style={styles.cardRow}
        onPress={() => void apply()}
      >
        <AppText variant="body">{t('otaApply')}</AppText>
      </SinkPressable>
    </Paper>
  )
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
  entryHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
})
