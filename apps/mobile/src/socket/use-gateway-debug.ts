import { useSyncExternalStore } from 'react'

import { getGatewayDebug, subscribeGatewayDebug } from './client'
import { socketTrace } from './trace'

export function useGatewayDebug() {
  return useSyncExternalStore(
    subscribeGatewayDebug,
    getGatewayDebug,
    getGatewayDebug,
  )
}

export function useSocketTraceEntries() {
  return useSyncExternalStore(
    socketTrace.subscribe,
    socketTrace.list,
    socketTrace.list,
  )
}
