import { motion } from '@yohaku/design-system/tokens'
import { useCallback } from 'react'
import type {
  GestureResponderEvent,
  NativeSyntheticEvent,
  ViewProps,
} from 'react-native'

import { NativePressView } from '../../../modules/yohaku'

export interface NativePressableProps extends ViewProps {
  disabled?: boolean
  haptic?: boolean
  onPress?: (event?: GestureResponderEvent) => void
}

export function NativePressable({
  accessibilityRole = 'button',
  accessibilityState,
  accessible = true,
  disabled = false,
  haptic = true,
  onAccessibilityTap,
  onPress,
  ...rest
}: NativePressableProps) {
  const handlePress = useCallback(
    (event: NativeSyntheticEvent<Record<string, never>>) => {
      if (!disabled) onPress?.(event as unknown as GestureResponderEvent)
    },
    [disabled, onPress],
  )
  const handleAccessibilityTap = useCallback(() => {
    if (disabled) return
    if (onAccessibilityTap) {
      onAccessibilityTap()
      return
    }
    onPress?.()
  }, [disabled, onAccessibilityTap, onPress])

  return (
    <NativePressView
      {...rest}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ ...accessibilityState, disabled }}
      accessible={accessible}
      disabled={disabled}
      haptic={haptic}
      pressScale={motion.pressScale}
      pressTranslateY={motion.pressTranslateY}
      onAccessibilityTap={handleAccessibilityTap}
      onNativePress={handlePress}
    />
  )
}
