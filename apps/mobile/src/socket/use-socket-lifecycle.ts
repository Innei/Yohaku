import { useEffect, useRef } from 'react'
import { AppState } from 'react-native'

import { subscribeApiBaseUrl } from '@/api/base-url'
import { useSession } from '@/auth/session-store'
import { useLocale } from '@/i18n'

import {
  connectGateway,
  disconnectGateway,
  emitUpdateLang,
  getGatewaySid,
  reconnectGateway,
} from './client'

export function useSocketLifecycle() {
  const session = useSession()
  const locale = useLocale()
  const sessionIdRef = useRef(session?.id)

  useEffect(() => {
    connectGateway()
    const unsubscribe = subscribeApiBaseUrl(() => reconnectGateway())
    return () => {
      unsubscribe()
      disconnectGateway()
    }
  }, [])

  useEffect(() => {
    if (sessionIdRef.current === session?.id) return
    sessionIdRef.current = session?.id
    if (getGatewaySid() || session?.id) reconnectGateway()
  }, [session?.id])

  useEffect(() => {
    emitUpdateLang(locale)
  }, [locale])

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && !getGatewaySid()) connectGateway()
    })
    return () => sub.remove()
  }, [])
}
