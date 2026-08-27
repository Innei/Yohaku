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
    // Default screens keep UIKit's platform-selected edge treatment. Screens
    // with a collapsing title hide the system top edge and draw their own
    // variable blur, timed with the title fade.
    scrollEdgeEffects: {
      bottom: 'automatic',
      top: 'automatic',
    },
  } as const
}
