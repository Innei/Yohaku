import { SettingsAvatar, YohakuNative } from '@modules/yohaku'
import { desc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import Constants from 'expo-constants'
import { Link, useFocusEffect, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import * as Updates from 'expo-updates'
import type { ReactNode } from 'react'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

import { deleteAccount, refreshSession, signOut } from '@/auth/session'
import type { SessionUser } from '@/auth/session-store'
import { useSession } from '@/auth/session-store'
import { EdgeEffectScrollView } from '@/components/navigation/edge-effect-scroll-view'
import type { GroupedListRow } from '@/components/ui'
import { AppText, Button, GroupedList, SinkPressable } from '@/components/ui'
import { showToast } from '@/components/ui/toast-store'
import { db } from '@/db'
import { likedRefs, readingHistory } from '@/db/schema'
import type { Locale } from '@/i18n'
import {
  localeNames,
  locales,
  setLocale,
  useLocale,
  useTranslations,
} from '@/i18n'
import { likedActivityCount } from '@/interactions/liked-count'
import { clearImageCache, imageCacheBytes } from '@/lib/image-cache'
import { openExternalUrl } from '@/lib/open-external'
import { getPrivacyUrl } from '@/lib/site-url'
import { loadPushConfig } from '@/push/config'
import { NotificationSettings } from '@/push/notification-settings'
import { syncAll } from '@/sync/engine'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

import { ActivityStats } from '../me/activity-stats'
import { showDeleteAccount, showMyComments } from '../me/activity-visibility'
import { commentTotalFromPage } from '../me/comment-total'
import { MembershipBanner } from '../me/membership-banner'
import { hasProviderIcon, ProviderIcon } from '../me/provider-icon'
import { useMyCommentsQuery } from '../me/use-my-comments'
import { showReaderHero } from './guest-card'

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
        <ProviderIcon
          color={palette.neutral[9]}
          provider={provider}
          size={14}
        />
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
  if (!session?.image) {
    return (
      <View style={[styles.avatarRing, { borderColor: palette.neutral[4] }]}>
        <View style={[styles.avatar, { backgroundColor: palette.neutral[3] }]}>
          <SymbolView
            name="person.crop.circle"
            size={36}
            tintColor={palette.neutral[6]}
          />
        </View>
      </View>
    )
  }

  return (
    <SettingsAvatar
      collapseDistance={120}
      imageUri={session.image}
      ringColor={palette.neutral[4]}
      style={styles.realAvatarSlot}
    />
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
        <AppText variant="entryTitleSans">
          {session ? (session.name ?? t('anonymous')) : t('signedOut')}
        </AppText>
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

export function ReaderScreen({
  pageIndicator,
  scrollsToTop,
}: {
  pageIndicator: ReactNode
  scrollsToTop: boolean
}) {
  const t = useTranslations('me')
  const ts = useTranslations('study')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const palette = usePalette()
  const locale = useLocale()
  const session = useSession()
  const version = Constants.expoConfig?.version ?? '—'
  const versionLabel = Updates.isEmbeddedLaunch
    ? t('versionEmbedded', { version })
    : t('versionOta', { version })
  const { data: likedRows } = useLiveQuery(likedQuery)
  const { data: readingRows } = useLiveQuery(readingQuery)
  const likedCount = likedActivityCount(likedRows ?? [])
  const readingCount = readingRows?.length ?? 0
  const [, setCacheEpoch] = useState(0)
  const storageLabel = formatStorageBytes(readStorageBytes())
  const commentsVisible = showMyComments(session)
  const deleteVisible = showDeleteAccount(session)
  const privacyUrl = getPrivacyUrl()
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
  const generalRows: GroupedListRow[] = [
    {
      id: 'language',
      label: t('language'),
      value: localeNames[locale],
      menu: locales.map((item) => ({
        id: item,
        title: localeNames[item],
        on: item === locale,
      })),
      onMenuSelect: (next) => {
        if (next === locale) return
        setLocale(next as Locale)
        void syncAll({ force: true })
      },
    },
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
    ...(privacyUrl
      ? [
          {
            id: 'privacy',
            label: t('privacy'),
            chevron: true,
            onPress: () => void openExternalUrl(privacyUrl),
          } satisfies GroupedListRow,
        ]
      : []),
    { id: 'version', label: t('version'), value: versionLabel },
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
      <EdgeEffectScrollView
        contentContainerStyle={styles.content}
        scrollsToTop={scrollsToTop}
        style={styles.scroll}
      >
        <View style={styles.heroBlock}>
          {showReaderHero(session) ? (
            <ProfileHero />
          ) : (
            <AppText variant="largeTitleSans">{ts('account')}</AppText>
          )}
          {pageIndicator}
        </View>
        <MembershipBanner />
        <ActivityStats
          commentsCount={commentsCount ?? 0}
          likedCount={likedCount}
          readingCount={readingCount}
          showComments={commentsVisible}
        />
        <GroupedList
          header={t('sectionGeneral')}
          rows={generalRows}
          style={styles.sectionList}
        />
        {pushConfigured ? <NotificationSettings /> : null}
        {accountRows.length > 0 ? (
          <GroupedList
            header={t('sectionAccount')}
            rows={accountRows}
            style={styles.sectionList}
          />
        ) : null}
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
  heroBlock: {
    gap: 10,
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
  realAvatarSlot: {
    width: 100,
    height: 100,
  },
  sectionList: {
    marginHorizontal: -20,
  },
  dev: {
    gap: 6,
  },
})
