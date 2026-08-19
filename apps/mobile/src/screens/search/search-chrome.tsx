import { Stack, useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import { useTranslations } from '@/i18n'
import { timings } from '@/theme/motion'
import { usePalette } from '@/theme/palette'

import type { SearchScope } from './local-search'

export function SearchChrome() {
  const router = useRouter()
  const t = useTranslations('common')

  return (
    <>
      <Stack.Screen
        options={{
          animation: 'fade',
          animationDuration: timings.fade.duration,
          headerBackVisible: !usesPaperNavigationControls,
          headerTitle: '',
          title: '',
        }}
      />
      {usesPaperNavigationControls && router.canGoBack() ? (
        <Stack.Toolbar asChild placement="left">
          <PaperNavigationControl
            accessibilityLabel={t('back')}
            icon="arrow.left"
            identifier="search-back"
            onPress={() => router.back()}
          />
        </Stack.Toolbar>
      ) : null}
    </>
  )
}

export function ListSearchToolbar({
  trailingPaper,
  trailingSystem,
  scope,
}: {
  trailingPaper?: ReactNode
  trailingSystem?: ReactNode
  scope: SearchScope
}) {
  const router = useRouter()
  const t = useTranslations('search')
  const palette = usePalette()
  const open = () => router.push({ pathname: '/search', params: { scope } })

  if (usesPaperNavigationControls) {
    return (
      <Stack.Toolbar asChild placement="right">
        <View style={styles.paperCluster}>
          <PaperNavigationControl
            accessibilityLabel={t('entry')}
            icon="magnifyingglass"
            identifier={`search-entry-${scope}`}
            onPress={open}
          />
          {trailingPaper}
        </View>
      </Stack.Toolbar>
    )
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        accessibilityLabel={t('entry')}
        icon="magnifyingglass"
        tintColor={palette.neutral[9]}
        onPress={open}
      />
      {trailingSystem}
    </Stack.Toolbar>
  )
}

const styles = StyleSheet.create({
  paperCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
