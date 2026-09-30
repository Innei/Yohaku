import { Stack, useRouter } from 'expo-router'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'
import { ReaderScreen } from '@/screens/study/reader-screen'
import { usePalette } from '@/theme/palette'

export default function ReaderRoute() {
  const router = useRouter()
  const t = useTranslations('study')
  const tc = useTranslations('common')
  const palette = usePalette()

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: t('account'), title: t('account') }}
      />
      {usesPaperNavigationControls ? (
        <Stack.Toolbar asChild placement="right">
          <PaperNavigationControl
            accessibilityLabel={tc('close')}
            icon="xmark"
            identifier="account-close"
            onPress={() => router.back()}
          />
        </Stack.Toolbar>
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel={tc('close')}
            icon="xmark"
            tintColor={palette.neutral[9]}
            onPress={() => router.back()}
          />
        </Stack.Toolbar>
      )}
      <ReaderScreen />
    </>
  )
}
