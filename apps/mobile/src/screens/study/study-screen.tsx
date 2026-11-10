import { Toolbar } from '@/components/navigation/header-toolbar'
import { YohakuStudyShell } from '@modules/yohaku'
import { isDuo } from '@modules/yohaku/duo-shell'
import { Stack, useRouter } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  useDuoBarItems,
  useInDuoStack,
} from '@/components/navigation/duo/bar-items'
import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import type { GroupedListRow } from '@/components/ui'
import { GroupedList } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { openExternalUrl } from '@/lib/open-external'
import { useOwner } from '@/owner/store'
import { usePalette } from '@/theme/palette'

import { MeAmbienceGrain, MeAmbienceWash } from '../me/me-ambience'
import { DeskCard } from './desk-card'
import { OwnerHero } from './owner-hero'
import { StudyDuoPanes } from './study-duo-panes'

const AVATAR_COLLAPSE_DISTANCE = 120
const DUO_PANES_MIN_WIDTH = 800

function OwnerSiteSections() {
  const t = useTranslations('me')
  const router = useRouter()
  const owner = useOwner()
  const siteRows: GroupedListRow[] = [
    {
      id: 'pages',
      label: t('pages'),
      chevron: true,
      navigates: true,
      onPress: () => router.push('/pages'),
    },
    ...(owner?.webUrl
      ? [
          {
            id: 'blog',
            label: t('blog'),
            value: owner.siteHost,
            chevron: true,
            onPress: () => void openExternalUrl(owner.webUrl),
          } satisfies GroupedListRow,
        ]
      : []),
  ]

  return (
    <>
      <DeskCard />
      {siteRows.length > 0 ? (
        <GroupedList rows={siteRows} style={styles.blog} />
      ) : null}
    </>
  )
}

function DuoAccountItem({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  useDuoBarItems([
    { id: 'account', label, onPress, systemImage: 'person.crop.circle' },
  ])
  return null
}

export function StudyScreen() {
  const palette = usePalette()
  const owner = useOwner()
  const router = useRouter()
  const t = useTranslations('study')
  const inDuoStack = useInDuoStack()
  const insets = useSafeAreaInsets()
  const headerHeight = useHeaderHeight()
  const [width, setWidth] = useState(0)
  const wide = isDuo && width >= DUO_PANES_MIN_WIDTH
  const openAccount = () => router.push('/reader')

  return (
    <View
      style={[styles.screen, { backgroundColor: palette.surface.desk }]}
      onLayout={
        isDuo ? (event) => setWidth(event.nativeEvent.layout.width) : undefined
      }
    >
      {inDuoStack ? (
        <DuoAccountItem label={t('account')} onPress={openAccount} />
      ) : usesPaperNavigationControls ? (
        <Toolbar asChild placement="right">
          <PaperNavigationControl
            accessibilityLabel={t('account')}
            icon="person.crop.circle"
            identifier="study-account"
            onPress={openAccount}
          />
        </Toolbar>
      ) : (
        <Toolbar placement="right">
          <Toolbar.Button
            accessibilityLabel={t('account')}
            icon="person.crop.circle"
            tintColor={palette.neutral[9]}
            onPress={openAccount}
          />
        </Toolbar>
      )}
      <MeAmbienceWash />
      {wide ? (
        <StudyDuoPanes>
          <OwnerSiteSections />
        </StudyDuoPanes>
      ) : (
        <YohakuStudyShell
          collapseDistance={AVATAR_COLLAPSE_DISTANCE}
          ownerImageUri={owner?.avatarUrl ?? ''}
          ringColor={palette.neutral[4]}
          style={[
            styles.scroll,
            isDuo
              ? { marginLeft: insets.left, marginRight: insets.right }
              : null,
          ]}
        >
          <View collapsable={false}>
            <View style={styles.pageContent}>
              <OwnerHero />
              <OwnerSiteSections />
            </View>
          </View>
        </YohakuStudyShell>
      )}
      <MeAmbienceGrain />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  pageContent: {
    gap: 16,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  blog: {
    marginHorizontal: -20,
  },
})
