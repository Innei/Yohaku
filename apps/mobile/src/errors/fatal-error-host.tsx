import { useLayoutEffect, useSyncExternalStore } from 'react'
import { StyleSheet, View } from 'react-native'

import { AppRecoveryScreen } from './app-recovery-screen'
import {
  clearFatalError,
  getFatalErrorSnapshot,
  registerFatalErrorHost,
  subscribeFatalError,
} from './fatal-error-store'

export function FatalErrorHost() {
  useLayoutEffect(registerFatalErrorHost, [])

  const error = useSyncExternalStore(
    subscribeFatalError,
    getFatalErrorSnapshot,
    getFatalErrorSnapshot,
  )

  if (!error) return null

  return (
    <View style={styles.overlay}>
      <AppRecoveryScreen message={error.message} onRetry={clearFatalError} />
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 10_000,
  },
})
