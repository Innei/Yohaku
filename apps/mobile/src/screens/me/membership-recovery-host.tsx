import { YohakuNative } from '@modules/yohaku'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { AppState } from 'react-native'

import { api } from '@/api/client'
import { useSession } from '@/auth/session-store'

import {
  confirmAndFinishAppleTransaction,
  shouldRetryAppleConfirmation,
} from './confirm-apple'
import { createMembershipRecoveryLifecycle } from './membership-recovery-lifecycle'
import {
  useMembershipAppleAccountToken,
  useMembershipPlans,
} from './use-membership'

const RETRY_DELAY_MS = 30_000

export function MembershipRecoveryHost() {
  const sessionId = useSession()?.id
  const { data: plans } = useMembershipPlans()
  const queryClient = useQueryClient()
  const appleIap = plans?.appleIap
  const { data: appleAccount } = useMembershipAppleAccountToken(
    Boolean(sessionId && appleIap?.enabled),
  )

  useEffect(() => {
    const productIds = [
      appleIap?.monthlyProductId,
      appleIap?.yearlyProductId,
    ].filter((productId): productId is string => Boolean(productId))
    if (
      !sessionId ||
      !appleIap?.enabled ||
      !appleAccount?.accountToken ||
      productIds.length !== 2
    ) {
      return
    }

    const lifecycle = createMembershipRecoveryLifecycle({
      addAppStateListener: (listener) =>
        AppState.addEventListener('change', listener),
      addTransactionListener: (listener) =>
        YohakuNative.addListener('onMembershipTransaction', listener),
      clearRetryTimer: clearTimeout,
      retryDelayMs: RETRY_DELAY_MS,
      setRetryTimer: setTimeout,
      recover: async () => {
        let tokens: string[]
        try {
          tokens = await YohakuNative.unfinishedMembershipTransactionJws({
            appAccountToken: appleAccount.accountToken,
            productIds,
          })
        } catch {
          return { needsRetry: true }
        }

        let confirmed = false
        let needsRetry = false
        for (const signedTransactionInfo of tokens) {
          try {
            await confirmAndFinishAppleTransaction(
              api.membershipConfirmApple,
              (token) => YohakuNative.finishMembershipTransaction(token),
              signedTransactionInfo,
            )
            confirmed = true
          } catch (error) {
            if (shouldRetryAppleConfirmation(error)) needsRetry = true
          }
        }
        if (confirmed) {
          await queryClient.invalidateQueries({
            queryKey: ['membership', 'status'],
          })
        }
        return { needsRetry }
      },
    })
    lifecycle.start()
    return () => lifecycle.stop()
  }, [
    appleIap?.enabled,
    appleIap?.monthlyProductId,
    appleIap?.yearlyProductId,
    appleAccount?.accountToken,
    queryClient,
    sessionId,
  ])

  return null
}
