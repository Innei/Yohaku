import { ActivityIndicator, Pressable } from 'react-native'

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
    // Plain Pressable: the Reanimated-wrapped Pressable did not receive taps
    // on Android, which left the social provider buttons unclickable.
    <Pressable
      accessibilityLabel={provider}
      accessibilityRole="button"
      onPress={() => {
        if (busy) return
        onPress()
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: palette.surface.paper,
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        opacity: dimmed ? 0.4 : pressed ? 0.8 : 1,
      })}
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
    </Pressable>
  )
}
