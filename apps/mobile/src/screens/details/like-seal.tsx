import { radius } from '@yohaku/design-system/tokens'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { AppText, SinkPressable } from '@/components/ui'
import { useLocale, useTranslations } from '@/i18n'
import { springs } from '@/theme/motion'
import { usePalette } from '@/theme/palette'
import { useNativeSerifFontStyle } from '@/theme/serif-font'

import { sealGlyph } from './seal-caption'

const SIZE = 64
const TILT = -5

export function LikeSeal({
  disabled,
  liked,
  onPress,
}: {
  disabled: boolean
  liked: boolean
  onPress: () => void
}) {
  const palette = usePalette()
  const locale = useLocale()
  const t = useTranslations('common')
  const serif = useNativeSerifFontStyle()
  const scale = useSharedValue(1)
  const tilt = useSharedValue(liked ? TILT : 0)
  const wasLikedRef = useRef(liked)

  useEffect(() => {
    if (liked && !wasLikedRef.current) {
      scale.set(withSequence(withTiming(1.12, { duration: 90 }), withSpring(1, springs.settle)))
      tilt.set(withSpring(TILT, springs.settle))
    } else if (!liked) {
      tilt.set(0)
    }
    wasLikedRef.current = liked
  }, [liked, scale, tilt])

  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }, { rotate: `${tilt.get()}deg` }],
  }))

  return (
    <SinkPressable
      accessibilityLabel={t('like')}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: liked }}
      disabled={disabled}
      haptic={false}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onPress()
      }}
    >
      <Animated.View
        style={[
          styles.seal,
          liked
            ? { backgroundColor: palette.accent, borderColor: palette.accent }
            : {
                backgroundColor: palette.surface.paper,
                borderColor: palette.accent,
              },
          animated,
        ]}
      >
        {liked ? (
          <View
            style={[styles.innerRing, { borderColor: palette.surface.paper }]}
          />
        ) : null}
        <AppText
          color={liked ? palette.surface.paper : palette.accent}
          style={[styles.glyph, serif]}
        >
          {sealGlyph(locale)}
        </AppText>
      </Animated.View>
    </SinkPressable>
  )
}

const styles = StyleSheet.create({
  seal: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: radius.field,
    borderWidth: 1.5,
    height: SIZE,
    justifyContent: 'center',
    width: SIZE,
  },
  innerRing: {
    borderCurve: 'continuous',
    borderRadius: radius.field - 3,
    borderWidth: 1.5,
    bottom: 2,
    left: 2,
    opacity: 0.85,
    position: 'absolute',
    right: 2,
    top: 2,
  },
  glyph: { fontSize: 30, lineHeight: 36 },
})
