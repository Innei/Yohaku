import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { api } from '@/api/client'
import { subscribeGatewayConnect } from '@/socket/client'

import { liveDeskQueryKey } from './companion-presence'
import type { DeskSnapshot } from './live-desk'
import { parseDeskSnapshot } from './live-desk'

export function useDeskSnapshot(enabled = true): DeskSnapshot {
  const queryClient = useQueryClient()
  const [focused, setFocused] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  const { data } = useQuery({
    enabled: focused && enabled,
    queryFn: () => api.getLiveDeskPublicState(),
    queryKey: liveDeskQueryKey,
    refetchOnMount: 'always',
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
  })

  useEffect(() => {
    return subscribeGatewayConnect(() => {
      void queryClient.invalidateQueries({ queryKey: liveDeskQueryKey })
    })
  }, [queryClient])

  useEffect(() => {
    if (!data?.state || typeof data.state !== 'object') return
    const expiresAt = (data.state as { projection?: { expiresAt?: unknown } })
      .projection?.expiresAt
    if (typeof expiresAt !== 'string') return
    const remaining = Date.parse(expiresAt) - Date.now()
    if (!Number.isFinite(remaining)) return
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, remaining))
    return () => clearTimeout(timer)
  }, [data])

  return useMemo(
    () => parseDeskSnapshot(data?.state, now),
    [data, now],
  )
}
