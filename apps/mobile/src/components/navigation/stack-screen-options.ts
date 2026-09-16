import { navigationScrollEdgeEffects } from './scroll-edges'

export function getStackScreenOptions(backgroundColor: string) {
  return {
    contentStyle: { backgroundColor },
    headerBackButtonDisplayMode: 'minimal',
    headerBackButtonMenuEnabled: true,
    headerBackVisible: false,
    headerShadowVisible: false,
    headerTitle: '',
    headerTransparent: true,
    title: '',
    scrollEdgeEffects: navigationScrollEdgeEffects,
  } as const
}
