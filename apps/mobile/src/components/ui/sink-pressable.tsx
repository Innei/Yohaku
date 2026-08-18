import { motion } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import type { PressableProps, StyleProp, ViewStyle } from 'react-native'
import { Pressable } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { springs, timings } from '@/theme/motion'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface SinkPressableProps extends Omit<PressableProps, 'style'> {
  haptic?: boolean
  style?: StyleProp<ViewStyle>
}

export function SinkPressable({
  style,
  haptic = true,
  onPressIn,
  onPressOut,
  ...rest
}: SinkPressableProps) {
  const pressed = useSharedValue(0)
  const scale = motion.pressScale
  const translateY = motion.pressTranslateY

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 - pressed.value * (1 - scale) },
      { translateY: pressed.value * translateY },
    ],
  }))

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        pressed.value = withTiming(1, timings.pressIn)
        if (haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
        onPressIn?.(event)
      }}
      onPressOut={(event) => {
        pressed.value = withSpring(0, springs.settle)
        onPressOut?.(event)
      }}
      {...rest}
    />
  )
}
