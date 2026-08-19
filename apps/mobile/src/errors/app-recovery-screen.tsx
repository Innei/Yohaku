import { reloadAppAsync } from 'expo'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppText, Button, Desk, Paper } from '@/components/ui'
import { useTranslations } from '@/i18n'

export function AppRecoveryScreen({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const t = useTranslations('system')

  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  const restart = useCallback(() => {
    void reloadAppAsync('Recover from fatal JavaScript error')
  }, [])

  return (
    <Desk style={styles.root}>
      <Paper accessibilityRole="alert" style={styles.card}>
        <AppText variant="entryTitleSans">{t('appErrorTitle')}</AppText>
        <AppText variant="secondary">{t('appErrorBody')}</AppText>
        <AppText selectable style={styles.message} variant="meta">
          {message}
        </AppText>
        <View style={styles.actions}>
          <Button label={t('appErrorRestart')} onPress={restart} />
          <Button
            label={t('appErrorRetry')}
            variant="paper"
            onPress={onRetry}
          />
        </View>
      </Paper>
      <StatusBar style="auto" />
    </Desk>
  )
}

const styles = StyleSheet.create({
  root: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    gap: 12,
    padding: 24,
  },
  message: {
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
})
