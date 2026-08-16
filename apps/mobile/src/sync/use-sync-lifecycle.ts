import { useEffect } from 'react'
import { AppState } from 'react-native'

import { syncAll } from './engine'

export function useSyncLifecycle(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    void syncAll()
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void syncAll()
    })
    return () => subscription.remove()
  }, [enabled])
}
