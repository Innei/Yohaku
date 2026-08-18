import * as SecureStore from 'expo-secure-store'
import { useEffect, useRef } from 'react'
import { Alert } from 'react-native'

import { useTranslations } from '@/i18n'

import { loadPushConfig } from './config'
import {
  readPushOnboardingDecision,
  shouldOfferPushOnboarding,
  writePushOnboardingDecision,
} from './onboarding'
import { enablePush, usePushState } from './runtime'

const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
}

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
        !shouldOfferPushOnboarding({
          configured: loadPushConfig().configured,
          authorizationStatus: push.authorizationStatus,
          decision,
        })
      ) {
        return
      }
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
    })()

    return () => {
      cancelled = true
    }
  }, [ready, push.authorizationStatus, t, tc])

  return null
}
