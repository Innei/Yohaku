import * as Updates from 'expo-updates'
import { useEffect } from 'react'
import { AppState } from 'react-native'

import { createOtaForegroundCheck } from './foreground-check'

export function useOtaForegroundCheck() {
  useEffect(() => {
    const lifecycle = createOtaForegroundCheck({
      isEnabled: () => Updates.isEnabled,
      checkForUpdate: () => Updates.checkForUpdateAsync(),
      fetchUpdate: () => Updates.fetchUpdateAsync(),
      addAppStateListener: (listener) =>
        AppState.addEventListener('change', listener),
    })
    lifecycle.start()
    return () => lifecycle.stop()
  }, [])
}
