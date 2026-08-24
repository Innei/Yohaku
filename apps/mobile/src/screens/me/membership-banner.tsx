import { TicketStubView, YohakuMembershipNative } from '@modules/yohaku'
import { useFocusEffect } from 'expo-router'
import { SymbolView } from 'expo-symbols'
import { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'

import {
  isAppleManagedMembership,
  membershipBannerKind,
  remainingMembershipDays,
} from '@/api/membership'
import { useSession } from '@/auth/session-store'
import { AppText, groupedListRadius, NativePressable } from '@/components/ui'
import type { Locale } from '@/i18n'
import { translate, useLocale, useTranslations } from '@/i18n'
import { usePalette } from '@/theme/palette'

import { useMembershipPlans, useMembershipStatus } from './use-membership'
import { useMembershipCheckout } from './use-membership-checkout'

function CardFill() {
  return (
    <TicketStubView
      cornerRadius={groupedListRadius}
      divisions={1}
      notchRadius={0}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    />
  )
}

function formatExpiry(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return translate(locale, 'time', 'yearMonthDay', {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  })
}

export function MembershipBanner() {
  const t = useTranslations('membership')
  const locale = useLocale()
  const palette = usePalette()
  const session = useSession()
  const { data: status, refetch: refetchStatus } = useMembershipStatus()
  const { data: plans, refetch: refetchPlans } = useMembershipPlans(
    Boolean(session),
  )
  const { present, syncEntitlements } = useMembershipCheckout()
  const membershipEnabled = plans?.appleIap?.enabled === true
  const kind = membershipBannerKind({
    loggedIn: Boolean(session),
    membershipEnabled,
    status,
  })

  useFocusEffect(
    useCallback(() => {
      if (!session) return
      void refetchStatus()
      void refetchPlans()
      void syncEntitlements()
    }, [refetchPlans, refetchStatus, session, syncEntitlements]),
  )

  if (kind === 'hidden') return null

  if (kind === 'cta') {
    return (
      <NativePressable style={styles.card} onPress={() => void present()}>
        <CardFill />
        <View
          style={[styles.icon, { backgroundColor: `${palette.accent}1F` }]}
        >
          <SymbolView name="crown.fill" size={18} tintColor={palette.accent} />
        </View>
        <View style={styles.copy}>
          <AppText variant="entryTitleSans">{t('becomeMember')}</AppText>
          <AppText variant="secondary">{t('becomeMemberHint')}</AppText>
        </View>
        <SymbolView
          name="chevron.right"
          size={16}
          tintColor={palette.neutral[5]}
        />
      </NativePressable>
    )
  }

  const period = status && status.status !== 'none' ? status : null
  if (!period) return null

  const days = remainingMembershipDays(period.currentPeriodEnd)
  const expiry = formatExpiry(period.currentPeriodEnd, locale)
  const planLabel =
    period.plan === 'yearly' ? t('planYearly') : t('planMonthly')
  const canManageInApple = isAppleManagedMembership(period)
  const content = (
    <>
      <CardFill />
      <View style={[styles.icon, { backgroundColor: `${palette.accent}1F` }]}>
        <SymbolView name="crown.fill" size={18} tintColor={palette.accent} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="entryTitleSans">{t('badgeMember')}</AppText>
          <View
            style={[styles.stamp, { backgroundColor: `${palette.accent}2E` }]}
          >
            <AppText color={palette.accent} variant="eyebrow">
              {planLabel}
            </AppText>
          </View>
        </View>
        <AppText style={styles.duration} variant="secondary">
          {t('daysLeft', { count: days })}
          {expiry ? ` · ${t('expireAt', { date: expiry })}` : ''}
        </AppText>
      </View>
      {canManageInApple ? (
        <SymbolView
          name="chevron.right"
          size={16}
          tintColor={palette.neutral[5]}
        />
      ) : null}
    </>
  )

  if (!canManageInApple) return <View style={styles.card}>{content}</View>

  return (
    <NativePressable
      style={styles.card}
      onPress={() => void YohakuMembershipNative.showManageSubscriptions()}
    >
      {content}
    </NativePressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: groupedListRadius,
    borderCurve: 'continuous',
    minHeight: 64,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stamp: {
    borderRadius: 4,
    borderCurve: 'continuous',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  duration: {
    fontVariant: ['tabular-nums'],
  },
})
