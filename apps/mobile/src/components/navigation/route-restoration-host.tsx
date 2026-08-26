import { YohakuNative } from '@modules/yohaku'
import * as Linking from 'expo-linking'
import { usePathname, useSegments } from 'expo-router'
import { useEffect } from 'react'

import { restorableRouteURL } from '@/lib/route-restoration'

export function RouteRestorationHost({ ready }: { ready: boolean }) {
  const pathname = usePathname()
  const segments = useSegments()
  const routeURL = restorableRouteURL(pathname, segments, Linking.createURL)

  useEffect(() => {
    if (!ready || !routeURL) return
    void YohakuNative.setRestorableRoute(routeURL)
  }, [ready, routeURL])

  return null
}
