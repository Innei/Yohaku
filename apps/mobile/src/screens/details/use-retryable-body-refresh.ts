import { useFocusEffect } from 'expo-router'
import { useCallback, useRef } from 'react'
import { AppState } from 'react-native'

const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000] as const

function retryDelay(attempt: number) {
  return RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
}

/**
 * Keeps a transient translated body visible while periodically checking for
 * the canonical translation. The loop exists only while the detail screen is
 * focused and the app is active; the caller disables it as soon as live-query
 * data reports a ready body.
 */
export function useRetryableBodyRefresh({
  enabled,
  refresh,
  refreshKey,
}: {
  enabled: boolean
  refresh: () => Promise<void>
  refreshKey: string
}) {
  const refreshRef = useRef(refresh)
  refreshRef.current = refresh

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return

      let active = AppState.currentState === 'active'
      let attempt = 0
      let cancelled = false
      let timer: ReturnType<typeof setTimeout> | null = null

      const clearTimer = () => {
        if (timer === null) return
        clearTimeout(timer)
        timer = null
      }

      const schedule = (delay: number) => {
        clearTimer()
        timer = setTimeout(() => void run(), delay)
      }

      const run = async () => {
        timer = null
        if (cancelled || !active) return
        await refreshRef.current().catch(() => {})
        if (cancelled || !active) return
        schedule(retryDelay(attempt++))
      }

      if (active) schedule(0)
      const subscription = AppState.addEventListener('change', (state) => {
        const nextActive = state === 'active'
        if (nextActive === active) return
        active = nextActive
        clearTimer()
        if (active) {
          attempt = 0
          schedule(0)
        }
      })

      return () => {
        cancelled = true
        clearTimer()
        subscription.remove()
      }
    }, [enabled, refreshKey]),
  )
}
