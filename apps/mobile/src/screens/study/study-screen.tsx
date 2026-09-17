import { SettingsAvatar } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { Image } from 'expo-image'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { useRef, useState } from 'react'
import type {
  AccessibilityActionEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
} from 'react-native'
import { StyleSheet, useWindowDimensions, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'

import { api } from '@/api/client'
import { useSession } from '@/auth/session-store'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import { usePaperTabBarInset } from '@/components/navigation/paper-tab-bar-inset'
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
import { ReaderScreen } from './reader-screen'

const AVATAR_COLLAPSE_DISTANCE = 120

function OwnerHero({ pageIndicator }: { pageIndicator: ReactNode }) {
  const owner = useOwner()
  const palette = usePalette()

  return (
    <View style={styles.hero}>
      {owner?.avatarUrl ? (
        <SettingsAvatar
          collapseDistance={AVATAR_COLLAPSE_DISTANCE}
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
      <WritingStats />
      <SocialRow />
      {pageIndicator}
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
    { key: 'posts', value: (data?.postCount ?? 0) + (data?.noteCount ?? 0), label: t('statPosts') },
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

function OwnerStudyPage({
  pageIndicator,
  scrollsToTop,
}: {
  pageIndicator: ReactNode
  scrollsToTop: boolean
}) {
  const t = useTranslations('me')
  const router = useRouter()
  const palette = usePalette()
  const owner = useOwner()
  const paperTabBarInset = usePaperTabBarInset()
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
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <MeAmbienceWash />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        scrollsToTop={scrollsToTop}
        style={styles.scroll}
        contentInset={{
          bottom: Math.max(0, AVATAR_COLLAPSE_DISTANCE - paperTabBarInset),
        }}
      >
        <OwnerHero pageIndicator={pageIndicator} />
        <DeskCard />
        {siteRows.length > 0 ? (
          <GroupedList rows={siteRows} style={styles.blog} />
        ) : null}
      </EdgeEffectScrollView>
      <MeAmbienceGrain />
    </View>
  )
}

function PageIndicator({
  activePage,
  labels,
  onSelectPage,
  progress,
}: {
  activePage: number
  labels: [string, string]
  onSelectPage: (page: number) => void
  progress: SharedValue<number>
}) {
  const palette = usePalette()
  const firstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 1],
      [1, 0.28],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [0, 1],
          [1, 0.55],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }))
  const secondStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 1],
      [0.28, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scaleX: interpolate(
          progress.value,
          [0, 1],
          [0.55, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }))

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') onSelectPage(1)
    if (event.nativeEvent.actionName === 'decrement') onSelectPage(0)
  }

  return (
    <View
      accessible
      accessibilityActions={[{ name: 'decrement' }, { name: 'increment' }]}
      accessibilityLabel={labels[activePage]}
      accessibilityRole="adjustable"
      style={styles.pageIndicator}
      accessibilityValue={{
        max: 2,
        min: 1,
        now: activePage + 1,
        text: labels[activePage],
      }}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <Animated.View
        style={[
          styles.pageIndicatorMark,
          { backgroundColor: palette.neutral[8] },
          firstStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.pageIndicatorMark,
          { backgroundColor: palette.neutral[8] },
          secondStyle,
        ]}
      />
    </View>
  )
}

export function StudyScreen() {
  const palette = usePalette()
  const owner = useOwner()
  const session = useSession()
  const t = useTranslations('study')
  const { width } = useWindowDimensions()
  const pagerRef = useRef<ScrollView>(null)
  const progress = useSharedValue(0)
  const [activePage, setActivePage] = useState(0)
  const labels: [string, string] = [
    owner?.name || owner?.siteHost || t('tabFallback'),
    session?.role === 'owner' ? t('account') : t('me'),
  ]
  const handlePagerScroll = useAnimatedScrollHandler(
    (event) => {
      progress.set(Math.min(1, Math.max(0, event.contentOffset.x / width)))
    },
    [width],
  )
  const selectPage = (page: number) => {
    setActivePage(page)
    pagerRef.current?.scrollTo({ animated: true, x: width * page })
  }
  const handlePagerSettled = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    setActivePage(Math.round(event.nativeEvent.contentOffset.x / width))
  }
  const indicator = (
    <PageIndicator
      activePage={activePage}
      labels={labels}
      progress={progress}
      onSelectPage={selectPage}
    />
  )

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <Animated.ScrollView
        directionalLockEnabled
        horizontal
        pagingEnabled
        bounces={false}
        contentInsetAdjustmentBehavior="never"
        ref={pagerRef}
        scrollEventThrottle={16}
        scrollsToTop={false}
        showsHorizontalScrollIndicator={false}
        style={styles.pager}
        onMomentumScrollEnd={handlePagerSettled}
        onScroll={handlePagerScroll}
      >
        <View
          accessibilityElementsHidden={activePage !== 0}
          style={[styles.page, { width }]}
        >
          <OwnerStudyPage
            pageIndicator={indicator}
            scrollsToTop={activePage === 0}
          />
        </View>
        <View
          accessibilityElementsHidden={activePage !== 1}
          style={[styles.page, { width }]}
        >
          <ReaderScreen
            pageIndicator={indicator}
            scrollsToTop={activePage === 1}
          />
        </View>
      </Animated.ScrollView>
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
  pager: {
    flex: 1,
  },
  page: {
    height: '100%',
  },
  pageIndicator: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
    height: 18,
    justifyContent: 'center',
    marginTop: 2,
  },
  pageIndicatorMark: {
    borderRadius: 1,
    height: 2,
    width: 18,
  },
  content: {
    flexGrow: 1,
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
