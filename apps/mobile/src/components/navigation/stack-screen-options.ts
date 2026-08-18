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
    // Default screens keep UIKit's platform-selected edge treatment. Detail
    // screens override the top edge for their collapsing title: iOS 26 uses
    // UIKit's automatic effect, while legacy iOS keeps the edge transparent.
    scrollEdgeEffects: {
      bottom: 'automatic',
      top: 'automatic',
    },
  } as const
}
