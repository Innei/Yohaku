import { YohakuStudyShell } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
import { PaperNavigationControl } from '@/components/navigation/paper-navigation-control'
import { usesPaperNavigationControls } from '@/components/navigation/platform'
import type { GroupedListRow } from '@/components/ui'
import { AppText, GroupedList, SinkPressable, SlotText } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { openExternalUrl } from '@/lib/open-external'
import { displaySite } from '@/owner/snapshot'
import { openSocialLink, socialLinks } from '@/owner/social-links'
import { useOwner } from '@/owner/store'
import { fonts } from '@/theme/fonts'
import { usePalette } from '@/theme/palette'

import { MeAmbienceGrain, MeAmbienceWash } from '../me/me-ambience'
import { DeskCard } from './desk-card'

const AVATAR_COLLAPSE_DISTANCE = 120

function OwnerHero() {
  const owner = useOwner()

  return (
    <View style={styles.hero}>
      {owner?.name ? (
        <AppText variant="entryTitle">{owner.name}</AppText>
      ) : null}
      {owner?.siteHost ? (
        <AppText style={styles.host} variant="eyebrow">
          {displaySite(owner.siteHost)}
        </AppText>
      ) : null}
      <WritingStats />
      <SocialRow />
    </View>
  )
}

function WritingStats() {
  const t = useTranslations('me')
  const locale = useLocale()
  const palette = usePalette()
  const { data } = useQuery({
    queryFn: () => api.siteInfo(),
    queryKey: ['site-info'],
    staleTime: 5 * 60_000,
  })

  const words = data?.totalWordCount
    ? Math.round(data.totalWordCount / (locale === 'en' ? 1000 : 10_000))
    : 0
  const [now] = useState(() => Date.now())
  const days = data?.firstPublishDate
    ? Math.floor((now - new Date(data.firstPublishDate).getTime()) / 86_400_000)
    : 0
  const stats = [
    {
      key: 'posts',
      value: (data?.postCount ?? 0) + (data?.noteCount ?? 0),
      label: t('statPosts'),
    },
    { key: 'words', value: words, label: t('statWordsUnit') },
    { key: 'days', value: days, label: t('statDays') },
  ]
  const textStyle = {
    ...fonts.sans,
    fontSize: 10,
    lineHeight: 14,
    color: palette.neutral[6],
  }

  // The row keeps its line whether or not the counts have landed, so the hero
  // never reflows when they do.
  return (
    <View style={styles.stats}>
      {data
        ? stats.map((stat, index) => (
            <View key={stat.key} style={styles.stat}>
              {index > 0 ? (
                <AppText color={palette.neutral[5]} style={textStyle}>
                  ·
                </AppText>
              ) : null}
              <SlotText textStyle={textStyle} value={stat.value} />
              <AppText color={palette.neutral[6]} style={textStyle}>
                {stat.label}
              </AppText>
            </View>
          ))
        : null}
    </View>
  )
}

function SocialRow() {
  const owner = useOwner()
  const palette = usePalette()
  const links = socialLinks(owner?.socialIds)

  if (links.length === 0) return null

  return (
    <View style={styles.socials}>
      {links.map((link) => (
        <SinkPressable
          accessibilityLabel={link.label}
          accessibilityRole="link"
          key={link.type}
          style={styles.social}
          onPress={() => void openSocialLink(link, Linking)}
        >
          <Image
            contentFit="contain"
            source={link.icon}
            style={styles.socialIcon}
            tintColor={palette.neutral[6]}
          />
        </SinkPressable>
      ))}
    </View>
  )
}

function OwnerStudyPage() {
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
    <View style={styles.pageContent}>
      <OwnerHero />
      <DeskCard />
      {siteRows.length > 0 ? (
        <GroupedList rows={siteRows} style={styles.blog} />
      ) : null}
    </View>
  )
}

export function StudyScreen() {
  const palette = usePalette()
  const owner = useOwner()
  const router = useRouter()
  const t = useTranslations('study')
  const openAccount = () => router.push('/reader')

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      {usesPaperNavigationControls ? (
        <Stack.Toolbar asChild placement="right">
          <PaperNavigationControl
            accessibilityLabel={t('account')}
            icon="person.crop.circle"
            identifier="study-account"
            onPress={openAccount}
          />
        </Stack.Toolbar>
      ) : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel={t('account')}
            icon="person.crop.circle"
            tintColor={palette.neutral[9]}
            onPress={openAccount}
          />
        </Stack.Toolbar>
      )}
      <MeAmbienceWash />
      <YohakuStudyShell
        collapseDistance={AVATAR_COLLAPSE_DISTANCE}
        ownerImageUri={owner?.avatarUrl ?? ''}
        ringColor={palette.neutral[4]}
        style={styles.scroll}
      >
        <View collapsable={false}>
          <OwnerStudyPage />
        </View>
      </YohakuStudyShell>
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
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  host: {
    textTransform: 'uppercase',
  },
  stats: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 14,
  },
  stat: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  socials: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 2,
  },
  social: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  socialIcon: {
    height: 18,
    width: 18,
  },
  blog: {
    marginHorizontal: -20,
  },
})
