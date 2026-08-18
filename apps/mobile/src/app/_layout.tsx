import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { Stack } from 'expo-router'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router/react-navigation'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, StyleSheet, useColorScheme, View } from 'react-native'

import { refreshSession } from '@/auth/session'
import { useSession } from '@/auth/session-store'
import { WebViewPoolWarmer } from '@/components/dom/webview-pool-warmer'
import { getStackScreenOptions } from '@/components/navigation/stack-screen-options'
import { SplashOverlay } from '@/components/splash/splash-overlay'
import { AppText, Desk, ToastHost } from '@/components/ui'
import { db } from '@/db'
import { useTranslations } from '@/i18n'
import { assertVendoredDomWebView } from '@/lib/assert-vendored-dom-webview'
import { queryClient } from '@/lib/query-client'
import { refreshOwnerSnapshot } from '@/owner/refresh'
import { PushOnboardingHost } from '@/push/push-onboarding-host'
import { useNotificationRouting } from '@/push/use-notification-routing'
import { usePushLifecycle } from '@/push/use-push-lifecycle'
import { useSocketLifecycle } from '@/socket/use-socket-lifecycle'
import { useSyncLifecycle } from '@/sync/use-sync-lifecycle'
import { useAppFonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import migrations from '../../drizzle/migrations'

LogBox.ignoreAllLogs()
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 120 })

if (__DEV__) {
  assertVendoredDomWebView()
}

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const t = useTranslations('system')
  const palette = usePalette()
  const fontsLoaded = useAppFonts()
  const { success: dbReady, error: dbError } = useMigrations(db, migrations)
  useSyncLifecycle(dbReady)
  useSocketLifecycle()
  const session = useSession()
  usePushLifecycle(session?.id)

  const dataReady = fontsLoaded && dbReady
  const failed = dbError !== undefined
  useNotificationRouting(dataReady && !failed)
  const [appPainted, setAppPainted] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    void refreshSession()
    void refreshOwnerSnapshot()
  }, [])

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      void SplashScreen.hideAsync().then(
        () => setRevealed(true),
        () => setRevealed(true),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!dataReady) return
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setAppPainted(true))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [dataReady])

  const onSplashFinished = useCallback(() => setSplashDone(true), [])

  return (
    <View style={[styles.root, { backgroundColor: palette.surface.desk }]}>
      {failed ? (
        <Desk style={styles.dbError}>
          <AppText variant="secondary">{t('dbInitFailed')}</AppText>
          <AppText variant="meta">{dbError.message}</AppText>
        </Desk>
      ) : null}

      {dataReady && !failed ? (
        <QueryClientProvider client={queryClient}>
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            <Stack screenOptions={getStackScreenOptions(palette.surface.desk)}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="dev"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.72, 1],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="comments/[id]"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.75, 1],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="login"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.72, 1],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="locale"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.5],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="desk"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.42],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="summary/[kind]/[id]"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.62, 1],
                  sheetGrabberVisible: true,
                }}
              />
              <Stack.Screen
                name="insights/[kind]/[id]"
                options={{
                  headerShown: false,
                  presentation: 'formSheet',
                  sheetAllowedDetents: [0.72, 1],
                  sheetGrabberVisible: true,
                }}
              />
            </Stack>
            <WebViewPoolWarmer />
            <PushOnboardingHost ready={dataReady && !failed} />
            <ToastHost />
          </ThemeProvider>
        </QueryClientProvider>
      ) : null}

      {splashDone ? null : (
        <SplashOverlay
          appPainted={appPainted}
          failed={failed}
          ready={dataReady}
          revealed={revealed}
          onFinished={onSplashFinished}
        />
      )}
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  dbError: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
})
