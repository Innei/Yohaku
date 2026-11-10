import { Platform } from 'react-native'

import { navigationScrollEdgeEffects } from './scroll-edges'

export function getStackScreenOptions(backgroundColor: string) {
  return {
    contentStyle: { backgroundColor },
    headerBackButtonDisplayMode: 'minimal',
    headerBackButtonMenuEnabled: true,
    // Android keeps the platform back arrow; iOS paper screens draw their own
    // control so the system one is hidden.
    headerBackVisible: Platform.OS === 'android',
    headerShadowVisible: false,
    headerTitle: '',
    headerTransparent: true,
    title: '',
    scrollEdgeEffects: navigationScrollEdgeEffects,
  } as const
}
