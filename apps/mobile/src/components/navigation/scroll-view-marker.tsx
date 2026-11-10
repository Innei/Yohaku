import { Platform, View, type ViewProps } from 'react-native'
import { ScrollViewMarker } from 'react-native-screens/experimental'

/**
 * `ScrollViewMarker` carries iOS 26 scroll edge effects into a scroll view.
 * Android's gamma implementation is not part of the supported surface yet, so
 * the marker degrades to a plain layout view there.
 */
export function ScrollViewMarkerCompat({
  scrollEdgeEffects: _effects,
  ...rest
}: ViewProps & { scrollEdgeEffects?: Record<string, string> }) {
  if (Platform.OS === 'ios') {
    return (
      <ScrollViewMarker {...(rest as any)} scrollEdgeEffects={_effects as never} />
    )
  }
  return <View {...rest} />
}
