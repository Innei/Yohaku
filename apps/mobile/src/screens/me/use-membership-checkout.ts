import { YohakuNative } from '@modules/yohaku'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { api, ApiError } from '@/api/client'
import type { MembershipAppleIap } from '@/api/membership'
import { useSession } from '@/auth/session-store'
import { showToast } from '@/components/ui/toast-store'
import { useTranslations } from '@/i18n'

import { confirmAndFinishAppleTransaction } from './confirm-apple'
import {
  useMembershipAppleAccountToken,
  useMembershipPlans,
} from './use-membership'

function productIdsOf(appleIap: MembershipAppleIap | undefined): string[] {
  if (!appleIap?.monthlyProductId || !appleIap.yearlyProductId) return []
  return [appleIap.monthlyProductId, appleIap.yearlyProductId]
}

async function finishMembershipTransaction(
  signedTransactionInfo: string,
): Promise<void> {
  await YohakuNative.finishMembershipTransaction(signedTransactionInfo)
}

export function useMembershipCheckout(): {
  appleIap: MembershipAppleIap | undefined
  present: () => Promise<'cancelled' | 'confirmed'>
  syncEntitlements: () => Promise<void>
} {
  const { data: plans } = useMembershipPlans()
  const appleIap = plans?.appleIap
  const session = useSession()
  const { data: appleAccount } = useMembershipAppleAccountToken(
    Boolean(session && appleIap?.enabled),
  )
  const queryClient = useQueryClient()
  const t = useTranslations('membership')

  const present = useCallback(async () => {
    const productIds = productIdsOf(appleIap)
    if (
      !appleIap?.enabled ||
      !appleAccount?.accountToken ||
      productIds.length === 0
    ) {
      return 'cancelled'
    }
    try {
      const result = await YohakuNative.presentSubscriptionStore({
        appAccountToken: appleAccount.accountToken,
        productIds,
      })
      if (result.status === 'cancelled') return 'cancelled'
      await confirmAndFinishAppleTransaction(
        api.membershipConfirmApple,
        finishMembershipTransaction,
        result.signedTransactionInfo,
      )
      await queryClient.invalidateQueries({ queryKey: ['membership', 'status'] })
      return 'confirmed'
    } catch (error) {
      showToast(
        error instanceof ApiError && error.status === 409
          ? t('appleAlreadyBound')
          : t('confirmFailed'),
      )
      return 'cancelled'
    }
  }, [appleAccount?.accountToken, appleIap, queryClient, t])

  const syncEntitlements = useCallback(async () => {
    const productIds = productIdsOf(appleIap)
    if (
      !session ||
      !appleIap?.enabled ||
      !appleAccount?.accountToken ||
      productIds.length === 0
    ) {
      return
    }
    try {
      const tokens = await YohakuNative.currentEntitlementJws({
        appAccountToken: appleAccount.accountToken,
        productIds,
      })
      let confirmed = false
      for (const signedTransactionInfo of tokens) {
        try {
          await confirmAndFinishAppleTransaction(
            api.membershipConfirmApple,
            finishMembershipTransaction,
            signedTransactionInfo,
          )
          confirmed = true
        } catch {}
      }
      if (confirmed) {
        await queryClient.invalidateQueries({
          queryKey: ['membership', 'status'],
        })
      }
    } catch {}
  }, [appleAccount?.accountToken, appleIap, queryClient, session])

  return { appleIap, present, syncEntitlements }
}
