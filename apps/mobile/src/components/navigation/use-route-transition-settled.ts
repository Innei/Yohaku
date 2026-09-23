import { useNavigation } from 'expo-router'
import { useEffect, useState } from 'react'

interface TransitionEndNavigation {
  addListener: (
    type: 'transitionEnd',
    listener: (event: { data: { closing: boolean } }) => void,
  ) => () => void
}

/**
 * Reports when the native stack has finished presenting the current route.
 * Route identity keeps a reused screen from inheriting the previous route's
 * settled state.
 */
export function useRouteTransitionSettled(routeIdentity: string): boolean {
  const navigation = useNavigation() as unknown as TransitionEndNavigation
  const [settledRoute, setSettledRoute] = useState<string | null>(null)

  useEffect(() => {
    // A form sheet can finish presenting before this listener is attached.
    // Deferring work must never leave the route's queries disabled forever.
    const settle = () => setSettledRoute(routeIdentity)
    const timeout = setTimeout(settle, 1_000)
    const unsubscribe = navigation.addListener('transitionEnd', (event) => {
      if (!event.data.closing) {
        clearTimeout(timeout)
        settle()
      }
    })
    return () => {
      clearTimeout(timeout)
      unsubscribe()
    }
  }, [navigation, routeIdentity])

  return settledRoute === routeIdentity
}
