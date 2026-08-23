import { ActivityIndicator } from 'react-native'

import { SinkPressable } from '@/components/ui'
import { usePalette } from '@/theme/palette'
import { shadow } from '@/theme/surfaces'

import { ProviderIcon } from './provider-icon'

export function ProviderButton({
  provider,
  busy,
  dimmed,
  size = 52,
  onPress,
}: {
  provider: string
  busy: boolean
  dimmed: boolean
  size?: number
  onPress: () => void
}) {
  const palette = usePalette()
  return (
    <SinkPressable
      disabled={busy || dimmed}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderCurve: 'continuous',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface.paper,
        boxShadow: shadow.paperSmall[palette.theme],
        opacity: dimmed ? 0.4 : 1,
      }}
      onPress={onPress}
    >
      {busy ? (
        <ActivityIndicator color={palette.neutral[7]} size="small" />
      ) : (
        <ProviderIcon
          color={palette.neutral[9]}
          provider={provider}
          size={size >= 44 ? 22 : 18}
        />
      )}
    </SinkPressable>
  )
}
