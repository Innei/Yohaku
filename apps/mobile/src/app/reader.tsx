import { Toolbar } from '@/components/navigation/header-toolbar'
import { Stack, useRouter } from 'expo-router'

import { useDuoBarItems, useInDuoStack } from '@/components/navigation/duo/bar-items'
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
  const inDuoStack = useInDuoStack()

  return (
    <>
      <Stack.Screen
        options={{ headerTitle: t('account'), title: t('account') }}
      />
      {inDuoStack ? (
        <DuoCloseItem label={tc('close')} onClose={() => router.back()} />
      ) : usesPaperNavigationControls ? (
        <Toolbar asChild placement="right">
          <PaperNavigationControl
            accessibilityLabel={tc('close')}
            icon="xmark"
            identifier="account-close"
            onPress={() => router.back()}
          />
        </Toolbar>
      ) : (
        <Toolbar placement="right">
          <Toolbar.Button
            accessibilityLabel={tc('close')}
            icon="xmark"
            tintColor={palette.neutral[9]}
            onPress={() => router.back()}
          />
        </Toolbar>
      )}
      <ReaderScreen />
    </>
  )
}

function DuoCloseItem({
  label,
  onClose,
}: {
  label: string
  onClose: () => void
}) {
  useDuoBarItems([
    { id: 'close', label, onPress: onClose, systemImage: 'xmark' },
  ])
  return null
}
