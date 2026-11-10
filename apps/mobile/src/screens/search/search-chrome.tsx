import { Toolbar } from '@/components/navigation/header-toolbar'
import { Stack, useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  type DuoBarItemSpec,
  useDuoBarItems,
  useInDuoStack,
} from '@/components/navigation/duo/bar-items'
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
        <Toolbar asChild placement="left">
          <PaperNavigationControl
            accessibilityLabel={t('back')}
            icon="arrow.left"
            identifier="search-back"
            onPress={() => router.back()}
          />
        </Toolbar>
      ) : null}
    </>
  )
}

type ListSearchToolbarProps = {
  trailingDuo?: DuoBarItemSpec[]
  trailingPaper?: ReactNode
  trailingSystem?: ReactNode
  scope: SearchScope
  systemAdaptiveTint?: boolean
}

export function ListSearchToolbar(props: ListSearchToolbarProps) {
  return useInDuoStack() ? (
    <DuoListSearchToolbar scope={props.scope} trailing={props.trailingDuo} />
  ) : (
    <StackListSearchToolbar {...props} />
  )
}

function DuoListSearchToolbar({
  scope,
  trailing = [],
}: {
  scope: SearchScope
  trailing?: DuoBarItemSpec[]
}) {
  const router = useRouter()
  const t = useTranslations('search')
  useDuoBarItems([
    {
      id: `search-entry-${scope}`,
      label: t('entry'),
      onPress: () => router.push({ pathname: '/search', params: { scope } }),
      systemImage: 'magnifyingglass',
    },
    ...trailing,
  ])
  return null
}

function StackListSearchToolbar({
  systemAdaptiveTint = false,
  trailingPaper,
  trailingSystem,
  scope,
}: ListSearchToolbarProps) {
  const router = useRouter()
  const t = useTranslations('search')
  const palette = usePalette()
  const open = () => router.push({ pathname: '/search', params: { scope } })

  if (usesPaperNavigationControls) {
    return (
      <Toolbar asChild placement="right">
        <View style={styles.paperCluster}>
          <PaperNavigationControl
            accessibilityLabel={t('entry')}
            icon="magnifyingglass"
            identifier={`search-entry-${scope}`}
            onPress={open}
          />
          {trailingPaper}
        </View>
      </Toolbar>
    )
  }

  return (
    <Toolbar placement="right">
      <Toolbar.Button
        accessibilityLabel={t('entry')}
        icon="magnifyingglass"
        tintColor={systemAdaptiveTint ? undefined : palette.neutral[9]}
        onPress={open}
      />
      {trailingSystem}
    </Toolbar>
  )
}

const styles = StyleSheet.create({
  paperCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
