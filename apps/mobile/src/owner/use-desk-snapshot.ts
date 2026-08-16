import { useQuery } from '@tanstack/react-query'
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import { api } from '@/api/client'

import type { DeskSnapshot } from './live-desk'
import { parseDeskSnapshot } from './live-desk'

const DESK_POLL_MS = 60_000

export function useDeskSnapshot(): DeskSnapshot {
  const [focused, setFocused] = useState(false)
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      return () => setFocused(false)
    }, []),
  )

  const { data, dataUpdatedAt } = useQuery({
    enabled: focused,
    queryFn: () => api.getLiveDeskPublicState(),
    queryKey: ['companion', 'presence', 'public'],
    refetchInterval: DESK_POLL_MS,
    retry: false,
  })

  return useMemo(
    () => parseDeskSnapshot(data?.state, dataUpdatedAt || Date.now()),
    [data, dataUpdatedAt],
  )
}
