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

  useEffect(
    () =>
      navigation.addListener('transitionEnd', (event) => {
        if (!event.data.closing) setSettledRoute(routeIdentity)
      }),
    [navigation, routeIdentity],
  )

  return settledRoute === routeIdentity
}
