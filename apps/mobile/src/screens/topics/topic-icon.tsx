import { StyleSheet, View } from 'react-native'

import { RemoteImage } from '@/components/ui'
import { usePalette } from '@/theme/palette'

const sizes = {
  sm: { radius: 5, size: 16 },
  md: { radius: 7, size: 22 },
  lg: { radius: 9, size: 32 },
} as const

export function TopicIcon({
  size,
  uri,
}: {
  size: keyof typeof sizes
  uri: string | null
}) {
  const palette = usePalette()
  if (!uri) return null
  const spec = sizes[size]
  return (
    <View
      style={[
        styles.frame,
        {
          borderColor:
            palette.theme === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.1)',
          borderRadius: spec.radius,
          height: spec.size,
          width: spec.size,
        },
      ]}
    >
      <RemoteImage
        contentFit="cover"
        uri={uri}
        style={{
          borderRadius: spec.radius,
          height: spec.size,
          width: spec.size,
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
})
