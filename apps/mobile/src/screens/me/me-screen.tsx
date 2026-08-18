import { YohakuNative } from '@modules/yohaku'
import { desc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import Constants from 'expo-constants'
import { Link, useFocusEffect, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

import { deleteAccount, refreshSession, signOut } from '@/auth/session'
import type { SessionUser } from '@/auth/session-store'
import { useSession } from '@/auth/session-store'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import type { GroupedListRow } from '@/components/ui'
import {
  AppText,
  Button,
  GroupedList,
  RemoteImage,
  SinkPressable,
} from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { db } from '@/db'
import { likedRefs, readingHistory } from '@/db/schema'
import { localeNames, useLocale, useTranslations } from '@/i18n'
import { likedActivityCount } from '@/interactions/liked-count'
import { clearImageCache, imageCacheBytes } from '@/lib/image-cache'
import { getPrivacyUrl } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import { loadPushConfig } from '@/push/config'
import { NotificationSettings } from '@/push/notification-settings'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

import { ActivityStats } from './activity-stats'
import { showDeleteAccount, showMyComments } from './activity-visibility'
import { commentTotalFromPage } from './comment-total'
import { DeskLine } from './desk-line'
import { MeAmbienceGrain, MeAmbienceWash } from './me-ambience'
import { MembershipBanner } from './membership-banner'
import { hasProviderIcon, ProviderIcon } from './provider-icon'
import { useMyCommentsQuery } from './use-my-comments'

function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function readStorageBytes(): number {
  try {
    return imageCacheBytes() + YohakuNative.databaseBytes()
  } catch {
    return 0
  }
}

const likedQuery = db.select().from(likedRefs)
const readingQuery = db
  .select()
  .from(readingHistory)
  .orderBy(desc(readingHistory.openedAt))

function IdentityLine({ session }: { session: SessionUser }) {
  const t = useTranslations('auth')
  const palette = usePalette()
  const identity = session.handle ?? session.email ?? ''
  const provider = session.provider
  const showIcon = provider ? hasProviderIcon(provider) : false
  if (!identity && !showIcon && provider !== 'credential') return null

  return (
    <View style={styles.identity}>
      {showIcon && provider ? (
        <ProviderIcon color={palette.neutral[9]} provider={provider} size={14} />
      ) : null}
      {identity ? (
        <AppText numberOfLines={1} style={styles.heroSub} variant="body">
          {identity}
        </AppText>
      ) : provider === 'credential' ? (
        <AppText numberOfLines={1} style={styles.heroSub} variant="body">
          {t('email')}
        </AppText>
      ) : null}
    </View>
  )
}

function Avatar({
  session,
  palette,
}: {
  session: SessionUser | null
  palette: Palette
}) {
  return (
    <View style={[styles.avatarRing, { borderColor: palette.neutral[4] }]}>
      {session?.image ? (
        <RemoteImage
          contentFit="cover"
          style={styles.avatar}
          uri={session.image}
        />
      ) : (
        <View style={[styles.avatar, { backgroundColor: palette.neutral[3] }]}>
          <SymbolView
            name="person.crop.circle"
            size={36}
            tintColor={palette.neutral[6]}
          />
        </View>
      )}
    </View>
  )
}

function ProfileHero() {
  const t = useTranslations('auth')
  const palette = usePalette()
  const router = useRouter()
  const session = useSession()

  return (
    <View style={styles.hero}>
      <Avatar palette={palette} session={session} />
      <View style={styles.heroText}>
        <View style={styles.nameRow}>
          <AppText variant="entryTitleSans">
            {session ? (session.name ?? t('anonymous')) : t('signedOut')}
          </AppText>
          {session?.role === 'owner' ? (
            <View
              style={[
                styles.stamp,
                { backgroundColor: `${palette.accent}2E` },
              ]}
            >
              <AppText color={palette.accent} variant="eyebrow">
                {t('owner')}
              </AppText>
            </View>
          ) : null}
        </View>
        {session ? (
          <IdentityLine session={session} />
        ) : (
          <AppText style={styles.heroSub} variant="body">
            {t('signInPitch')}
          </AppText>
        )}
      </View>
      {session ? null : (
        <Button
          label={t('signIn')}
          style={{ alignSelf: 'center' }}
          onPress={() => router.push('/login')}
        />
      )}
    </View>
  )
}

function Section({ label, rows }: { label: string; rows: GroupedListRow[] }) {
  const palette = usePalette()
  return (
    <View style={styles.section}>
      <AppText
        color={palette.neutral[5]}
        style={styles.sectionLabel}
        variant="eyebrow"
      >
        {label}
      </AppText>
      <GroupedList rows={rows} style={styles.sectionList} />
    </View>
  )
}

export function MeScreen() {
  const t = useTranslations('me')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const palette = usePalette()
  const router = useRouter()
  const locale = useLocale()
  const owner = useOwner()
  const session = useSession()
  const version = Constants.expoConfig?.version ?? '—'
  const { data: likedRows } = useLiveQuery(likedQuery)
  const { data: readingRows } = useLiveQuery(readingQuery)
  const likedCount = likedActivityCount(likedRows ?? [])
  const readingCount = readingRows?.length ?? 0
  const [, setCacheEpoch] = useState(0)
  const storageLabel = formatStorageBytes(readStorageBytes())
  const commentsVisible = showMyComments(session)
  const deleteVisible = showDeleteAccount(session)
  const commentsQuery = useMyCommentsQuery(locale, commentsVisible)
  const commentsPage = commentsQuery.data?.pages[0]
  const commentsCount = commentsQuery.isError
    ? commentTotalFromPage(commentsPage?.pagination.total ?? null, {
        error: commentsQuery.error,
      })
    : commentsPage
      ? commentTotalFromPage(null, {
          total: commentsPage.pagination.total,
        })
      : null

  useFocusEffect(
    useCallback(() => {
      void refreshSession()
      setCacheEpoch((value) => value + 1)
    }, []),
  )

  const pushConfigured = loadPushConfig().configured
  const privacyUrl = getPrivacyUrl()
  const generalRows: GroupedListRow[] = [
    {
      id: 'language',
      label: t('language'),
      value: localeNames[locale],
      chevron: true,
      onPress: () => router.push('/locale'),
    },
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
    {
      id: 'storage',
      label: t('storage'),
      value: storageLabel,
      onPress: () => {
        Alert.alert(t('storageClear'), t('storageClearConfirm'), [
          { style: 'cancel', text: tc('cancel') },
          {
            text: t('storageClear'),
            onPress: () => {
              void clearImageCache().then(() => {
                showToast(t('storageCleared'))
                setCacheEpoch((value) => value + 1)
              })
            },
          },
        ])
      },
    },
    { id: 'version', label: t('version'), value: version },
  ]

  const accountRows: GroupedListRow[] = [
    ...(session
      ? [
          {
            id: 'signOut',
            label: ta('signOut'),
            danger: true,
            onPress: () => {
              Alert.alert(ta('signOut'), ta('signOutConfirm'), [
                { style: 'cancel', text: tc('cancel') },
                {
                  style: 'destructive',
                  text: ta('signOut'),
                  onPress: () => void signOut(),
                },
              ])
            },
          } satisfies GroupedListRow,
        ]
      : []),
    ...(deleteVisible
      ? [
          {
            id: 'deleteAccount',
            label: t('deleteAccount'),
            danger: true,
            onPress: () => {
              Alert.alert(t('deleteAccount'), t('deleteAccountConfirm'), [
                { style: 'cancel', text: tc('cancel') },
                {
                  style: 'destructive',
                  text: t('deleteAccount'),
                  onPress: () => {
                    void deleteAccount().catch(() => {
                      Alert.alert(t('deleteAccount'), t('deleteAccountFailed'))
                    })
                  },
                },
              ])
            },
          } satisfies GroupedListRow,
        ]
      : []),
  ]

  return (
    <View style={[styles.screen, { backgroundColor: palette.surface.desk }]}>
      <MeAmbienceWash />
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        style={styles.scroll}
      >
        <ProfileHero />
        <MembershipBanner />
        <ActivityStats
          commentsCount={commentsCount ?? 0}
          likedCount={likedCount}
          readingCount={readingCount}
          showComments={commentsVisible}
        />
        <Section label={t('sectionGeneral')} rows={generalRows} />
        {pushConfigured ? <NotificationSettings /> : null}
        {accountRows.length > 0 ? (
          <Section label={t('sectionAccount')} rows={accountRows} />
        ) : null}
        <DeskLine />
        {__DEV__ ? (
          <Link asChild href="/dev-demos">
            <SinkPressable style={styles.dev}>
              <AppText variant="entryTitleSans">
                {t('componentGallery')}
              </AppText>
              <AppText variant="body">{t('componentGalleryHint')}</AppText>
            </SinkPressable>
          </Link>
        ) : null}
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
    gap: 28,
  },
  hero: {
    alignItems: 'center',
    gap: 14,
  },
  heroText: {
    alignItems: 'center',
    gap: 4,
  },
  heroSub: {
    textAlign: 'center',
    flexShrink: 1,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stamp: {
    borderRadius: 4,
    borderCurve: 'continuous',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  sectionList: {
    marginHorizontal: -20,
  },
  dev: {
    gap: 6,
  },
})
