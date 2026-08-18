import { Link } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { API_PRESETS, apiBaseUrl, setApiBaseUrl } from '@/api/base-url'
import { AppText, Paper, SinkPressable } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { resetAndResync } from '@/sync/engine'
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
    <View style={[styles.sheet, { backgroundColor: palette.surface.desk }]}>
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
      <Link asChild href="/dev-demos">
        <SinkPressable>
          <Paper style={styles.entry}>
            <AppText variant="entryTitle">{t('componentGallery')}</AppText>
            <AppText variant="secondary">{t('componentGalleryHint')}</AppText>
          </Paper>
        </SinkPressable>
      </Link>
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
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
})
