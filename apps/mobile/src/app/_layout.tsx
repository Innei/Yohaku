import { isDuo } from '@modules/yohaku/duo-shell'
import { QueryClientProvider } from '@tanstack/react-query'
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator'
import { type ErrorBoundaryProps, Stack } from 'expo-router'
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from 'expo-router/react-navigation'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, Platform, StyleSheet, useColorScheme, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { refreshSession } from '@/auth/session'
import { useSession } from '@/auth/session-store'
import { installSocialRedirectListener } from '@/auth/social-flow'
import { DuoStack } from '@/components/navigation/duo/navigators'
import { rootScreens } from '@/components/navigation/root-screens'
import { RouteRestorationHost } from '@/components/navigation/route-restoration-host'
import { getStackScreenOptions } from '@/components/navigation/stack-screen-options'
import { SplashOverlay } from '@/components/splash/splash-overlay'
import { AppText, BannerHost, Desk } from '@/components/ui'
import { ImagePreviewHost } from '@/components/ui/image-preview-host'
import { db } from '@/db'
import { AppRecoveryScreen } from '@/errors/app-recovery-screen'
import { FatalErrorHost } from '@/errors/fatal-error-host'
import { useTranslations } from '@/i18n'
import { assertVendoredDomWebView } from '@/lib/assert-vendored-dom-webview'
import { queryClient } from '@/lib/query-client'
import { useOtaForegroundCheck } from '@/ota/use-ota-foreground-check'
import { refreshOwnerSnapshot } from '@/owner/refresh'
import { PushOnboardingHost } from '@/push/push-onboarding-host'
import { useNotificationRouting } from '@/push/use-notification-routing'
import { usePushLifecycle } from '@/push/use-push-lifecycle'
import { MembershipRecoveryHost } from '@/screens/me/membership-recovery-host'
import { useSocketLifecycle } from '@/socket/use-socket-lifecycle'
import { useSyncErrorBanner } from '@/sync/use-sync-error-banner'
import { useSyncLifecycle } from '@/sync/use-sync-lifecycle'
import { useAppFonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'
import { splashTiming } from '@/theme/splash-timing'

import migrations from '../../drizzle/migrations'

LogBox.ignoreAllLogs()
SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({
  fade: true,
  duration: splashTiming.nativeFade.duration,
})

if (__DEV__) {
  assertVendoredDomWebView()
}

export const unstable_settings = {
  anchor: '(tabs)',
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  // Release builds do not show the LogBox stack; surface it in logcat so field
  // failures from the Android port remain diagnosable.
  console.error('Yohaku recovered from:', error?.message, error?.stack)
  return (
    <AppRecoveryScreen message={error.message} onRetry={() => void retry()} />
  )
}

export default function RootLayout() {
  const colorScheme = useColorScheme()
  const t = useTranslations('system')
  const palette = usePalette()
  const fontsLoaded = useAppFonts()
  const { success: dbReady, error: dbError } = useMigrations(db, migrations)
  useSyncLifecycle(dbReady)
  useSyncErrorBanner()
  useOtaForegroundCheck()
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
    installSocialRedirectListener()
  }, [])

  useEffect(() => {
    let handoffTimer: ReturnType<typeof setTimeout> | undefined
    const frame = requestAnimationFrame(() => {
      SplashScreen.hide()
      handoffTimer = setTimeout(
        () => setRevealed(true),
        splashTiming.nativeFade.handoffDelay,
      )
    })
    return () => {
      cancelAnimationFrame(frame)
      if (handoffTimer) clearTimeout(handoffTimer)
    }
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
  const screens = rootScreens(palette.surface.desk)

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
          <MembershipRecoveryHost />
          <ThemeProvider
            value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}
          >
            {isDuo ? (
              <DuoStack>
                {screens.map((screen) => (
                  <DuoStack.Screen
                    key={screen.name}
                    name={screen.name}
                    options={screen.options}
                  />
                ))}
              </DuoStack>
            ) : (
              <Stack
                screenOptions={getStackScreenOptions(palette.surface.desk)}
              >
                {screens.map((screen) => (
                  <Stack.Screen
                    key={screen.name}
                    name={screen.name}
                    options={screen.options}
                  />
                ))}
              </Stack>
            )}
            <RouteRestorationHost ready={appPainted} />
            <PushOnboardingHost ready={dataReady && !failed && splashDone} />
            <BannerHost />
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
      <FatalErrorHost />
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

/**
 * Android draws scrolling content under the transparent status bar. A paper
 * strip over the status bar keeps timestamps and glyphs legible on list screens
 * without a native header.
 */
function AndroidStatusBarScrim() {
  const insets = useSafeAreaInsets()
  const palette = usePalette()
  if (Platform.OS !== 'android' || insets.top <= 0) return null
  return (
    <View
      pointerEvents="none"
      style={{
        backgroundColor: palette.surface.desk,
        elevation: 40,
        height: insets.top,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0,
        zIndex: 9999,
      }}
    />
  )
}
