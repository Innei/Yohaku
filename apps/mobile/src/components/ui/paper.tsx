import { radius } from '@yohaku/design-system/tokens'
import type { ViewProps } from 'react-native'
import { View } from 'react-native'

import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

export function Desk({ style, ...rest }: ViewProps) {
  const palette = usePalette()
  return (
    <View
      style={[{ flex: 1, backgroundColor: palette.surface.desk }, style]}
      {...rest}
    />
  )
}

export function Paper({ style, ...rest }: ViewProps) {
  const palette = usePalette()
  return (
    <View
      style={[
        {
          backgroundColor: palette.surface.paper,
          borderRadius: radius.paper,
          borderCurve: 'continuous',
          boxShadow: shadow.paper[palette.theme],
        },
        style,
      ]}
      {...rest}
    />
  )
}
