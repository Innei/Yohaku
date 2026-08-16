import { YohakuNative } from '@modules/yohaku'
import { useQuery } from '@tanstack/react-query'
import { desc } from 'drizzle-orm'
import { useLiveQuery } from 'drizzle-orm/expo-sqlite'
import Constants from 'expo-constants'
import { Link, useFocusEffect, useRouter } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'

import { api } from '@/api/client'
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
import type { Translator } from '@/i18n'
import { localeNames, useLocale, useTranslations } from '@/i18n'
import { likedActivityCount } from '@/interactions/liked-count'
import { clearImageCache, imageCacheBytes } from '@/lib/image-cache'
import { getPrivacyUrl } from '@/lib/site-url'
import { useOwner } from '@/owner/store'
import type { Palette } from '@/theme/palette'
import { usePalette } from '@/theme/palette'

import { ActivityStats } from './activity-stats'
import { showDeleteAccount, showMyComments } from './activity-visibility'
import { commentTotalFromPage } from './comment-total'
import { DeskLine } from './desk-line'
import { MeAmbienceGrain, MeAmbienceWash } from './me-ambience'

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

const providerLabels: Record<string, string> = {
  github: 'GitHub',
  google: 'Google',
  apple: 'Apple',
}

function identityLine(session: SessionUser, t: Translator<'auth'>): string {
  const identity = session.handle ?? session.email ?? ''
  const provider = session.provider
    ? (providerLabels[session.provider] ??
      (session.provider === 'credential' ? t('email') : session.provider))
    : null
  if (identity && provider) return `${identity} · ${provider}`
  return identity || (provider ?? '')
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
  const secondary = session ? identityLine(session, t) : t('signInPitch')

  return (
    <View style={styles.hero}>
      <Avatar palette={palette} session={session} />
      <View style={styles.heroText}>
        <View style={styles.nameRow}>
          <AppText variant="entryTitleSans">
            {session ? (session.name ?? t('anonymous')) : t('signedOut')}
          </AppText>
          {session?.role === 'owner' ? (
            <View style={[styles.stamp, { borderColor: palette.accent }]}>
              <AppText color={palette.accent} variant="eyebrow">
                {t('owner')}
              </AppText>
            </View>
          ) : null}
        </View>
        {secondary ? (
          <AppText style={styles.heroSub} variant="body">
            {secondary}
          </AppText>
        ) : null}
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
  const commentsQuery = useQuery({
    queryKey: ['me-comments', 'total'],
    enabled: commentsVisible,
    queryFn: () => api.myComments(1),
  })
  const commentsCount = commentsQuery.isError
    ? commentTotalFromPage(commentsQuery.data?.pagination.total ?? null, {
        error: commentsQuery.error,
      })
    : commentsQuery.data
      ? commentTotalFromPage(null, {
          total: commentsQuery.data.pagination.total,
        })
      : null

  useFocusEffect(
    useCallback(() => {
      void refreshSession()
      setCacheEpoch((value) => value + 1)
    }, []),
  )

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
        <ActivityStats
          commentsCount={commentsCount ?? 0}
          likedCount={likedCount}
          readingCount={readingCount}
          showComments={commentsVisible}
        />
        <Section label={t('sectionGeneral')} rows={generalRows} />
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
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 4,
    borderCurve: 'continuous',
    paddingHorizontal: 5,
    paddingVertical: 2,
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
