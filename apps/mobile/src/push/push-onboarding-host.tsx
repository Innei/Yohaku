import { YohakuNative } from '@modules/yohaku'
import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'

import { useTranslations } from '@/i18n'
import { secretStoreAsync } from '@/lib/secret-store'

import { loadPushConfig } from './config'
import {
  PUSH_ONBOARDING_SURFACE_SETTLE_MS,
  readPushOnboardingDecision,
  shouldPresentPushOnboardingPrompt,
  writePushOnboardingDecision,
} from './onboarding'
import { enablePush, usePushState } from './runtime'

const storage = secretStoreAsync

export function PushOnboardingHost({ ready }: { ready: boolean }) {
  const t = useTranslations('push')
  const tc = useTranslations('common')
  const push = usePushState()
  const offeredRef = useRef(false)

  useEffect(() => {
    if (!ready || offeredRef.current) return
    let cancelled = false

    void (async () => {
      const decision = await readPushOnboardingDecision(storage)
      if (cancelled) return
      if (
        !shouldPresentPushOnboardingPrompt({
          configured: loadPushConfig().configured,
          authorizationStatus: push.authorizationStatus,
          decision,
          surfaceSettled: ready,
        })
      ) {
        return
      }
      await new Promise<void>((resolve) => {
        setTimeout(resolve, PUSH_ONBOARDING_SURFACE_SETTLE_MS)
      })
      if (cancelled) return
      offeredRef.current = true
      Alert.alert(t('onboardingTitle'), t('onboardingBody'), [
        {
          text: tc('cancel'),
          style: 'cancel',
          onPress: () => {
            void writePushOnboardingDecision(storage, 'dismissed')
          },
        },
        {
          text: t('onboardingConfirm'),
          onPress: () => {
            void (async () => {
              await writePushOnboardingDecision(storage, 'accepted')
              await enablePush()
            })()
          },
        },
      ])
      // Alert presentation can rebuild UITabBar's layer tree and drop the
      // compact sublayerTransform. Re-apply after the alert window is up.
      void YohakuNative.configureCompactNativeTabBar()
    })()

    return () => {
      cancelled = true
    }
  }, [ready, push.authorizationStatus, t, tc])

  return null
}
