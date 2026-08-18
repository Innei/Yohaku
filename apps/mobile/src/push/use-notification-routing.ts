import * as Notifications from 'expo-notifications'
import { type Href, useRouter } from 'expo-router'
import { useEffect, useMemo } from 'react'

import { createNotificationResponseHandler } from './notification-routing'

export const useNotificationRouting = (ready: boolean) => {
  const router = useRouter()
  const handleResponse = useMemo(
    () =>
      createNotificationResponseHandler((path) => router.push(path as Href)),
    [router],
  )

  useEffect(() => {
    if (!ready) return
    let active = true
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (active && response) handleResponse(response)
    })
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse)
    return () => {
      active = false
      subscription.remove()
    }
  }, [handleResponse, ready])
}
