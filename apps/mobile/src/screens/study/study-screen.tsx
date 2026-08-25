import { SettingsAvatar } from '@modules/yohaku'
import { useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import { refreshSession } from '@/auth/session'
import { useSession } from '@/auth/session-store'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import type { GroupedListRow } from '@/components/ui'
import { AppText, GroupedList } from '@/components/ui'
import { useTranslations } from '@/i18n'
import { getPrivacyUrl } from '@/lib/site-url'
import { displaySite } from '@/owner/snapshot'
import { useOwner } from '@/owner/store'
import { usePalette } from '@/theme/palette'

import { MeAmbienceGrain, MeAmbienceWash } from '../me/me-ambience'
import { MembershipBanner } from '../me/membership-banner'
import { DeskCard } from './desk-card'
import { GuestDoor } from './guest-door'

function OwnerHero() {
  const owner = useOwner()
  const palette = usePalette()

  return (
    <View style={styles.hero}>
      {owner?.avatarUrl ? (
        <SettingsAvatar
          collapseDistance={120}
          imageUri={owner.avatarUrl}
          ringColor={palette.neutral[4]}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: palette.neutral[10] }]} />
      )}
      {owner?.name ? (
        <AppText variant="entryTitle">{owner.name}</AppText>
      ) : null}
      {owner?.siteHost ? (
        <AppText style={styles.host} variant="eyebrow">
          {displaySite(owner.siteHost)}
        </AppText>
      ) : null}
    </View>
  )
}

export function StudyScreen() {
  const t = useTranslations('me')
  const palette = usePalette()
  const owner = useOwner()
  const session = useSession()
  const privacyUrl = getPrivacyUrl()
  const siteRows: GroupedListRow[] = [
    ...(owner?.webUrl
      ? [
          {
            id: 'blog',
            label: t('blog'),
            value: owner.siteHost,
            chevron: true,
            onPress: () => void WebBrowser.openBrowserAsync(owner.webUrl),
          } satisfies GroupedListRow,
        ]
      : []),
    ...(privacyUrl
      ? [
          {
            id: 'privacy',
            label: t('privacy'),
            chevron: true,
            onPress: () => void WebBrowser.openBrowserAsync(privacyUrl),
          } satisfies GroupedListRow,
        ]
      : []),
  ]

  useFocusEffect(
    useCallback(() => {
      void refreshSession()
    }, []),
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <MeAmbienceWash />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <OwnerHero />
        <DeskCard />
        <MembershipBanner />
        {siteRows.length > 0 ? (
          <GroupedList style={styles.blog} rows={siteRows} />
        ) : null}
        <GuestDoor session={session} />
      </EdgeEffectScrollView>
      <MeAmbienceGrain />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
  },
  host: {
    textTransform: 'uppercase',
  },
  blog: {
    marginHorizontal: -20,
  },
})
