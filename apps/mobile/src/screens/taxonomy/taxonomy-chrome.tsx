import { Stack, useRouter } from 'expo-router'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'

export function TaxonomyBackControl() {
  const router = useRouter()
  const t = useTranslations('common')

  if (usesPaperNavigationControls) {
    return router.canGoBack() ? (
      <Stack.Toolbar asChild placement="left">
        <PaperNavigationControl
          accessibilityLabel={t('back')}
          icon="arrow.left"
          identifier="taxonomy-back"
          onPress={() => router.back()}
        />
      </Stack.Toolbar>
    ) : null
  }

  return null
}
